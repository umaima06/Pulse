# intelligence.py
import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from config import CRISIS_TYPES, URGENCY_RULES

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def build_prompt(crisis_types: list, urgency_rules: dict) -> str:
    """
    Builds the Gemini prompt dynamically from config.
    If you add a new crisis type to config.py, the prompt updates automatically.
    """
    crisis_list = ", ".join(crisis_types)
    rules = urgency_rules

    return f"""
You are an AI assistant for an NGO coordination system in India called PULSE X.
Your job is to read any message — voice transcript, SMS, WhatsApp message, 
or handwritten form text — and extract structured information.

The message may be in Hindi, Telugu, Tamil, English, or any mixed combination.
Always respond in English. Return ONLY valid JSON. No explanation. No markdown. No backticks.

Extract this exact structure:
{{
  "need_type": "one of: {crisis_list}",
  "urgency_raw": "one of: critical, high, medium, low",
  "urgency_score": <integer 1-100>,
  "location": {{
    "description": "<place name or area mentioned, or 'unknown'>",
    "district": "<district if mentioned, else null>",
    "state": "<state if mentioned or inferred, else null>"
  }},
  "affected_people": <integer or null if unknown>,
  "days_unmet": <integer or null if unknown>,
  "summary": "<one clear sentence in English describing the situation>",
  "language_detected": "<language of original message>",
  "key_details": ["<important detail 1>", "<important detail 2>"],
  "confidence": <float 0.0 to 1.0>
}}

Urgency score rules (additive):
- Start at {rules['base_score']} for any report
- Add {rules['medical_emergency_bonus']} if this is a medical emergency
- Add {rules['children_elderly_bonus']} if children or elderly are mentioned
- Add {rules['per_3_days_unmet_bonus']} for every 3 days the need has gone unmet
- Add {rules['large_population_bonus']} if more than {rules['large_population_threshold']} people are affected
- Subtract {abs(rules['partial_resolution_penalty'])} if need is already partially addressed
- Cap at {rules['max_score']}, floor at {rules['min_score']}

If the message is vague or unclear, do your best and set confidence below 0.5.
If need_type cannot be determined, default to the most likely one from the list.
"""

MASTER_PROMPT = build_prompt(CRISIS_TYPES, URGENCY_RULES)


def analyze_report(raw_input: str) -> dict:
    """
    Core function. Takes any raw text, returns structured dict.
    Works with any language, any crisis type defined in config.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=MASTER_PROMPT + "\n\nMessage to analyze:\n" + raw_input,
            config=types.GenerateContentConfig(
                temperature=0.1,       # Low temp = more consistent JSON
                max_output_tokens=500,
            )
        )

        text = response.text.strip()

        # Robust JSON cleaning
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    text = part
                    break

        result = json.loads(text.strip())

        # Validate required fields exist
        required = ["need_type", "urgency_score", "location", "summary"]
        for field in required:
            if field not in result:
                result[field] = None

        # Normalize need_type to config values
        if result["need_type"] not in CRISIS_TYPES:
            result["need_type"] = CRISIS_TYPES[0]  # default to first

        return {"success": True, "data": result, "raw_input": raw_input[:100]}

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"JSON parse failed: {str(e)}",
            "raw_response": text if 'text' in locals() else "no response"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def escalate_urgency(base_score: int, hours_since_reported: int, 
                     need_type: str = "default") -> int:
    from config import URGENCY_ESCALATION
    rule = URGENCY_ESCALATION.get(need_type, URGENCY_ESCALATION["default"])
    intervals = hours_since_reported // rule["hours"]
    escalation = intervals * rule["points"]
    return min(100, base_score + escalation)


def get_alert_level(score: int) -> str:
    from config import CRITICAL_THRESHOLD, HIGH_THRESHOLD, MEDIUM_THRESHOLD
    if score >= CRITICAL_THRESHOLD:
        return "CRITICAL"
    elif score >= HIGH_THRESHOLD:
        return "HIGH"
    elif score >= MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"


if __name__ == "__main__":
    test_inputs = [
        "There is no clean water in our village for 6 days. 300 people including children affected. Nalgonda district.",
        "hamare gaon mein 5 din se paani nahi hai, 200 log hain, bahut problem ho rahi hai",
        "మా గ్రామంలో వైద్య సహాయం అవసరం. ఒక వ్యక్తికి పాము కాటు వేసింది.",
        "Urgent! Our area mein flood aa gaya hai, 50 families stranded hain, need food and shelter ASAP. Warangal",
        "bhai kuch karo yaar log bhuke hain",
    ]

    print("=" * 60)
    print("PULSE X — Intelligence Engine Test")
    print(f"Crisis types loaded from config: {CRISIS_TYPES}")
    print("=" * 60)

    for i, test in enumerate(test_inputs, 1):
        print(f"\nTest {i}: {test[:70]}...")
        result = analyze_report(test)
        if result["success"]:
            d = result["data"]
            print(f"  Need:     {d['need_type']} ({d['urgency_raw']})")
            print(f"  Score:    {d['urgency_score']}/100 → {get_alert_level(d['urgency_score'])}")
            print(f"  Location: {d['location']['description']}, {d['location']['district']}")
            print(f"  People:   {d['affected_people']} | Days unmet: {d['days_unmet']}")
            print(f"  Summary:  {d['summary']}")
            print(f"  Confidence: {d['confidence']}")
        else:
            print(f"  FAILED: {result['error']}")
        print("-" * 50)

    # Test escalation
    print("\n── Urgency Escalation Test ──")
    base = 65
    for hours in [0, 6, 12, 24, 48]:
        escalated = escalate_urgency(base, hours)
        print(f"  After {hours:2d}h: {base} → {escalated} ({get_alert_level(escalated)})")