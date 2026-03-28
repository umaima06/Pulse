# intelligence.py — PULSE X AI Brain
# Primary: Groq (free, fast) | Fallback: Gemini

import json
import os
import time
import urllib.request
import urllib.parse
from groq import Groq
from dotenv import load_dotenv
from config import CRISIS_TYPES, URGENCY_RULES, URGENCY_ESCALATION
from config import CRITICAL_THRESHOLD, HIGH_THRESHOLD, MEDIUM_THRESHOLD

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ── AI caller with Gemini fallback ────────────────────────────
def _call_ai(prompt: str) -> str:
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500,
        )
        return response.choices[0].message.content
    except Exception as groq_error:
        try:
            from google import genai
            from google.genai import types
            gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=500
                )
            )
            return response.text
        except Exception as gemini_error:
            raise Exception(
                f"Both failed. Groq: {groq_error} | Gemini: {gemini_error}"
            )


# ── Prompt builder ────────────────────────────────────────────
def build_prompt(crisis_types: list, urgency_rules: dict) -> str:
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


# ── Core analysis function ────────────────────────────────────
def analyze_report(raw_input: str) -> dict:
    try:
        text = _call_ai(
            MASTER_PROMPT + "\n\nMessage to analyze:\n" + raw_input
        ).strip()

        # Clean JSON if model adds backticks
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

        # Ensure required fields exist
        for field in ["need_type", "urgency_score", "location", "summary"]:
            if field not in result:
                result[field] = None

        # Normalize need_type
        if result["need_type"] not in CRISIS_TYPES:
            result["need_type"] = CRISIS_TYPES[0]

        # Auto-geocode the location
        coords = get_coordinates(result.get("location") or {})
        result["coordinates"] = coords

        return {"success": True, "data": result, "raw_input": raw_input[:100]}

    except json.JSONDecodeError as e:
        return {"success": False, "error": f"JSON parse failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Geocoding — works for ANY location in India ───────────────
def get_coordinates(location_data: dict) -> dict:
    if not location_data:
        return {"lat": None, "lon": None, "found": False}

    parts = []
    if location_data.get("description") and \
       location_data["description"] != "unknown":
        parts.append(location_data["description"])
    if location_data.get("district"):
        parts.append(location_data["district"])
    if location_data.get("state"):
        parts.append(location_data["state"])
    parts.append("India")

    search_query = ", ".join(parts)

    try:
        encoded = urllib.parse.quote(search_query)
        url = (
            f"https://nominatim.openstreetmap.org/search"
            f"?q={encoded}&format=json&limit=1&countrycodes=in"
        )
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "PULSE-X-NGO-System/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            results = json.loads(response.read().decode())

        if results:
            return {
                "lat": float(results[0]["lat"]),
                "lon": float(results[0]["lon"]),
                "found": True,
                "matched": results[0].get("display_name", search_query)
            }
    except Exception as e:
        print(f"  [Geocoding failed for '{search_query}': {e}]")

    return {"lat": None, "lon": None, "found": False}


# ── Urgency escalation ────────────────────────────────────────
def escalate_urgency(
    base_score: int,
    hours_since_reported: int,
    need_type: str = "default"
) -> int:
    rule = URGENCY_ESCALATION.get(need_type, URGENCY_ESCALATION["default"])
    intervals = hours_since_reported // rule["hours"]
    return min(100, base_score + intervals * rule["points"])


# ── Alert level ───────────────────────────────────────────────
def get_alert_level(score: int) -> str:
    if score >= CRITICAL_THRESHOLD:
        return "CRITICAL"
    elif score >= HIGH_THRESHOLD:
        return "HIGH"
    elif score >= MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"


# ── Run tests ─────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        "No clean water in Nalgonda for 6 days. 300 people including children.",
        "hamare gaon mein 5 din se paani nahi hai, 200 log hain",
        "మా గ్రామంలో వైద్య సహాయం అవసరం. పాము కాటు వేసింది.",
        "Flood in Warangal. 50 families need food urgently.",
        "bhai log bhuke hain kuch karo",
    ]

    print("=" * 60)
    print("PULSE X — Full Pipeline Test (AI + Geocoding)")
    print("=" * 60)

    for i, test in enumerate(tests, 1):
        print(f"\nTest {i}: {test[:65]}...")
        r = analyze_report(test)
        if r["success"]:
            d = r["data"]
            c = d.get("coordinates", {})
            print(f"  Need:     {d['need_type']} | Score: {d['urgency_score']}/100 → {get_alert_level(d['urgency_score'])}")
            print(f"  Location: {d['location']['description']}, {d['location']['district']}")
            if c.get("found"):
                print(f"  Coords:   {c['lat']:.4f}, {c['lon']:.4f} ✅")
            else:
                print(f"  Coords:   not found ⚠️")
            print(f"  Summary:  {d['summary']}")
        else:
            print(f"  FAILED: {r['error']}")
        print("-" * 50)
        time.sleep(1)

    print("\n── Escalation Test ──")
    for hours in [0, 6, 24, 48]:
        s = escalate_urgency(65, hours, "medical")
        print(f"  {hours:2d}h → {s}/100 ({get_alert_level(s)})")