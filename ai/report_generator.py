# report_generator.py — PULSE X Auto Report Generator
# Turns raw cluster data into professional NGO impact reports

import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_cluster_report(cluster: dict, reports: list) -> dict:
    """
    Takes a cluster + its individual reports.
    Returns a professional 3-paragraph NGO impact report.
    
    cluster: {need_type, combined_urgency, alert_level, 
              village_count, total_affected, centroid_lat, centroid_lon}
    reports: list of individual report dicts from Firestore
    """

    # Build context from real data
    locations = list(set([
        r.get("district") or r.get("location_text") or "Unknown area"
        for r in reports
        if r.get("district") or r.get("location_text")
    ]))
    
    summaries = [r.get("summary", "") for r in reports if r.get("summary")]
    languages = list(set([r.get("language", "") for r in reports if r.get("language")]))
    days_values = [r.get("days_unmet") for r in reports if r.get("days_unmet")]
    max_days = max(days_values) if days_values else "unknown"

    prompt = f"""
You are a professional NGO report writer for PULSE X, a crisis coordination system in India.

Write a formal 3-paragraph impact report based on this crisis cluster data.
Use precise, factual language. Sound like a real NGO field report.
Return ONLY the report text. No titles. No headers. No JSON.

CRISIS DATA:
- Crisis type: {cluster['need_type']}
- Alert level: {cluster['alert_level']}
- Urgency score: {cluster['combined_urgency']}/100
- Villages/areas affected: {cluster['village_count']}
- Total people affected: {cluster['total_affected']}
- Locations: {', '.join(locations) if locations else 'Multiple locations'}
- Days crisis unmet: {max_days}
- Languages reported in: {', '.join(languages) if languages else 'Multiple'}

FIELD REPORTS RECEIVED:
{chr(10).join(f'- {s}' for s in summaries[:5])}

PARAGRAPH 1 — Situation summary:
Describe the crisis clearly. What is happening, where, how many affected, for how long.

PARAGRAPH 2 — Urgency and human impact:
Explain why this is urgent. Who is most at risk (children, elderly, specific groups).
What happens if this goes unaddressed for another 24-48 hours.

PARAGRAPH 3 — Recommended action:
What specific help is needed. What type of volunteers/resources should be deployed.
Expected outcome if action is taken within 6 hours.
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
        )
        report_text = response.choices[0].message.content.strip()

        return {
            "success": True,
            "report": report_text,
            "metadata": {
                "cluster_id":      cluster.get("cluster_id"),
                "need_type":       cluster["need_type"],
                "alert_level":     cluster["alert_level"],
                "urgency_score":   cluster["combined_urgency"],
                "total_affected":  cluster["total_affected"],
                "village_count":   cluster["village_count"],
                "locations":       locations,
                "days_unmet":      max_days,
                "report_language": "English"
            }
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def generate_pre_alert(region: str, need_type: str, 
                        historical_pattern: str) -> dict:
    """
    Predictive pre-alert generator.
    Flags regions likely to face a crisis before reports arrive.
    """
    prompt = f"""
You are an AI analyst for PULSE X, an NGO crisis prediction system in India.

Generate a SHORT pre-alert warning (2 sentences max) for NGO coordinators.
Sound professional and specific. Return ONLY the warning text.

Region: {region}
Predicted crisis type: {need_type}
Historical pattern: {historical_pattern}

Example format:
"Pre-alert: [Region] has historically reported [need_type] shortages during [season/condition]. 
Recommend proactive volunteer deployment and resource staging within the next 48 hours."
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=150,
        )
        return {
            "success": True,
            "pre_alert": response.choices[0].message.content.strip(),
            "region": region,
            "predicted_need": need_type
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Tests ─────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("PULSE X — Report Generator Test")
    print("=" * 60)

    # Test 1: Cluster report
    mock_cluster = {
        "cluster_id":      "cluster_water_hyd",
        "need_type":       "water",
        "alert_level":     "CRITICAL",
        "combined_urgency": 92,
        "village_count":   3,
        "total_affected":  650,
        "centroid_lat":    17.38,
        "centroid_lon":    78.48
    }

    mock_reports = [
        {
            "summary": "300 people in Nalgonda have had no clean water for 6 days including children.",
            "location_text": "Nalgonda",
            "district": "Nalgonda",
            "language": "English",
            "days_unmet": 6
        },
        {
            "summary": "200 people in a village near Hyderabad without water for 5 days.",
            "location_text": "Hyderabad outskirts",
            "district": "Hyderabad",
            "language": "Hindi",
            "days_unmet": 5
        },
        {
            "summary": "150 families in Warangal district facing acute water shortage.",
            "location_text": "Warangal",
            "district": "Warangal",
            "language": "Telugu",
            "days_unmet": 4
        }
    ]

    print("\nTest 1 — Cluster Impact Report:")
    print("-" * 50)
    result = generate_cluster_report(mock_cluster, mock_reports)
    if result["success"]:
        print(result["report"])
        print(f"\nMetadata: {result['metadata']['total_affected']} people | "
              f"{result['metadata']['village_count']} villages | "
              f"Score: {result['metadata']['urgency_score']}/100")
    else:
        print(f"FAILED: {result['error']}")

    print("\n" + "=" * 60)

    # Test 2: Pre-alert
    print("\nTest 2 — Predictive Pre-Alert:")
    print("-" * 50)
    pre_alert = generate_pre_alert(
        region="Marathwada, Maharashtra",
        need_type="water",
        historical_pattern="Severe water shortages every year April-June due to drought conditions"
    )
    if pre_alert["success"]:
        print(pre_alert["pre_alert"])
    else:
        print(f"FAILED: {pre_alert['error']}")