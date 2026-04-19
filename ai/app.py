# app.py — PULSE X AI Service
# This is the bridge between your Python brain and Person B's Node.js backend
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
from intelligence import analyze_report, escalate_urgency, get_alert_level
from clustering import cluster_reports
from matching import match_volunteers
from report_generator import generate_cluster_report, generate_pre_alert
import os
import requests
app = Flask(__name__)
CORS(app)  # Allows Node.js backend to call this

# ── Health check ──────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "PULSE X AI is running", "version": "1.0"})


# ── Main endpoint: analyze any raw input ──────
@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Person B calls this with raw text from any source.
    Returns structured crisis data ready for Firestore.
    
    Input:  { "text": "hamare gaon mein paani nahi hai..." }
    Output: { "success": true, "data": { ...structured crisis data } }
    """
    body = request.get_json()
    
    if not body or 'text' not in body:
        return jsonify({
            "success": False,
            "error": "Missing 'text' field in request body"
        }), 400
    
    raw_text = body['text'].strip()
    
    if not raw_text:
        return jsonify({
            "success": False, 
            "error": "Text cannot be empty"
        }), 400
    
    result = analyze_report(raw_text)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500


# ── Cluster endpoint: group reports into clusters ──
@app.route('/cluster', methods=['POST'])
def cluster():
    """
    Person B sends all active reports, gets back clusters.
    
    Input:  { "reports": [ {id, need_type, urgency_score, lat, lon, affected_people}, ... ] }
    Output: { "clusters": [ {cluster_id, need_type, combined_urgency, alert_level, ...} ] }
    """
    body = request.get_json()
    
    if not body or 'reports' not in body:
        return jsonify({"success": False, "error": "Missing 'reports' array"}), 400
    
    reports = body['reports']
    
    if not isinstance(reports, list):
        return jsonify({"success": False, "error": "'reports' must be an array"}), 400
    
    clusters = cluster_reports(reports)
    
    return jsonify({
        "success": True,
        "cluster_count": len(clusters),
        "clusters": clusters
    }), 200


# ── Match endpoint: find best volunteers for a cluster ──
@app.route('/match', methods=['POST'])
def match():
    """
    Person B sends a cluster + available volunteers, gets ranked matches.
    
    Input:  { 
                "cluster": { need_type, combined_urgency, centroid_lat, centroid_lon },
                "volunteers": [ {id, name, skills, lat, lon, available, available_now} ]
            }
    Output: { "matches": [ {volunteer_id, name, match_score, distance_km, ...} ] }
    """
    body = request.get_json()
    
    if not body or 'cluster' not in body or 'volunteers' not in body:
        return jsonify({
            "success": False,
            "error": "Missing 'cluster' or 'volunteers' in request"
        }), 400
    
    matches = match_volunteers(body['cluster'], body['volunteers'])
    
    return jsonify({
        "success": True,
        "match_count": len(matches),
        "matches": matches
    }), 200


# ── Escalate endpoint: recalculate urgency over time ──
@app.route('/escalate', methods=['POST'])
def escalate():
    """
    Person B calls this on a schedule (every hour via Cloud Function).
    Recalculates urgency for all unresolved reports.
    
    Input:  { "reports": [ {id, urgency_score, need_type, hours_since_reported} ] }
    Output: { "updated": [ {id, old_score, new_score, alert_level} ] }
    """
    body = request.get_json()
    
    if not body or 'reports' not in body:
        return jsonify({"success": False, "error": "Missing 'reports'"}), 400
    
    updated = []
    for report in body['reports']:
        old_score = report.get('urgency_score', 50)
        new_score = escalate_urgency(
            base_score=old_score,
            hours_since_reported=report.get('hours_since_reported', 0),
            need_type=report.get('need_type', 'default')
        )
        updated.append({
            "id": report['id'],
            "old_score": old_score,
            "new_score": new_score,
            "changed": new_score != old_score,
            "alert_level": get_alert_level(new_score)
        })
    
    return jsonify({
        "success": True,
        "updated_count": len([r for r in updated if r['changed']]),
        "reports": updated
    }), 200

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({"reply": "No message provided"}), 400

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
"content": """You are PULSE AI, a real-time disaster response system.

IMPORTANT: Only describe THIS system. Do NOT give generic NGO explanations.

PULSE works like this:

1. Users report problems (chat / WhatsApp / form)
2. AI analyzes the message using NLP
3. System assigns urgency score
4. Nearby reports are clustered into crisis zones
5. Volunteers are matched based on distance + skills
6. System predicts future crises using patterns
7. Dashboard shows real-time analytics

Your behavior:
- Be clear and slightly conversational
- Keep answers practical, not theoretical
- If user asks general chat → reply normally
- If user asks about PULSE → explain using above flow ONLY
- Do NOT invent fake features like emails or manual assignment

Keep answers short but smart.
"""
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            }
        )

        result = response.json()

        # 🧠 safety check
        if "choices" not in result:
            print("Groq error:", result)
            return jsonify({
                "reply": "⚠️ AI temporarily unavailable."
            }), 500

        reply = result["choices"][0]["message"]["content"]

        return jsonify({ "reply": reply })

    except Exception as e:
        print("AI ERROR:", e)
        return jsonify({
            "reply": "⚠️ AI service error."
        }), 500

@app.route('/generate-report', methods=['POST'])
def generate_report():
    """
    Person C calls this when NGO clicks 'Generate Report' on dashboard.
    Input:  { "cluster": {...}, "reports": [...] }
    Output: { "success": true, "report": "...", "metadata": {...} }
    """
    body = request.get_json()
    if not body or 'cluster' not in body:
        return jsonify({"success": False, "error": "Missing cluster data"}), 400
    
    result = generate_cluster_report(
        cluster=body['cluster'],
        reports=body.get('reports', [])
    )
    return jsonify(result), 200 if result['success'] else 500

@app.route('/verify-proof', methods=['POST'])
def verify_proof():
    """
    Multi-layer AI verification of volunteer proof photos.
    Checks: content relevance, stock photo detection, field authenticity.
    """
    import base64
    import urllib.request as urlreq
    import json

    body = request.get_json()
    if not body or 'image_url' not in body or 'task' not in body:
        return jsonify({"success": False, "error": "Missing image_url or task"}), 400

    image_url = body['image_url']
    task = body['task']
    image_auth = body.get('image_auth', '')

    try:
        # Download image from Twilio
        req = urlreq.Request(
            image_url,
            headers={
                'User-Agent': 'PULSE-X/1.0',
                'Authorization': image_auth
            }
        )
        with urlreq.urlopen(req, timeout=10) as response:
            image_bytes = response.read()

        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        task_context = {
            "water": "water distribution, water tankers, people collecting water, filled containers, water supply activity, water pipes being fixed",
            "food":  "food distribution, meals being served, food packets, people receiving food, ration distribution, cooking for community",
            "medical": "medical aid, first aid being given, doctor treating patient, medicine distribution, health camp, medical equipment"
        }
        expected = task_context.get(task.get('need_type', 'water'), "humanitarian aid activity in field")

        prompt = f"""You are a fraud detection and verification AI for PULSE X, an NGO task verification system.

A volunteer claimed to complete this task:
- Task type: {task.get('need_type', 'unknown')}
- Location: {task.get('location_text', 'unknown')}  
- People to help: {task.get('affected_people', 'unknown')}

They sent this image as proof. Analyze it carefully for ALL of the following:

CHECK 1 — CONTENT MATCH:
Does the image show evidence of: {expected}?
Look for visible aid activity, people being helped, relevant supplies or equipment.

CHECK 2 — AUTHENTICITY (most important):
- Does this look like a real field photo or a stock/professional photo?
- Stock photos: perfect lighting, posed subjects, commercial quality
- Real field photos: natural lighting, candid moments, phone camera quality, visible surroundings
- Is there any sign this is a screenshot, downloaded image, or taken indoors in non-crisis context?

CHECK 3 — CONTEXT PLAUSIBILITY:
- Does the setting match a field crisis scenario?
- Are there visible signs of the reported crisis type?
- Does it look like India / rural / urban poor area consistent with NGO work?

Based on ALL three checks, provide your verdict.

Return ONLY this JSON. No explanation. No markdown:
{{
  "verified": true or false,
  "confidence": <float 0.0 to 1.0>,
  "fraud_risk": "low" or "medium" or "high",
  "checks": {{
    "content_matches_task": true or false,
    "looks_authentic_field_photo": true or false,
    "context_is_plausible": true or false
  }},
  "reason": "<one clear sentence explaining verdict>",
  "detected_activity": "<what you actually see in the image>",
  "flags": ["<any concern 1>", "<any concern 2>"]
}}

Be strict. If anything looks suspicious, set fraud_risk to high and verified to false.
A volunteer sending a Google Images screenshot should NEVER pass."""

        from google import genai
        from google.genai import types

        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                types.Part.from_text(text=prompt)
            ]
        )

        text = response.text.strip()
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

        # Final verdict logic
        checks = result.get("checks", {})
        all_checks_pass = (
            checks.get("content_matches_task") and
            checks.get("looks_authentic_field_photo") and
            checks.get("context_is_plausible")
        )

        # Override if fraud risk is high
        if result.get("fraud_risk") == "high":
            result["verified"] = False
            result["confidence"] = min(result.get("confidence", 0.3), 0.3)

        # Must pass all 3 checks to be verified
        if not all_checks_pass:
            result["verified"] = False

        return jsonify({"success": True, "verification": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route('/pre-alert', methods=['POST'])
def pre_alert():
    """
    Generates a predictive warning for a region.
    Input:  { "region": "...", "need_type": "...", "historical_pattern": "..." }
    Output: { "success": true, "pre_alert": "..." }
    """
    body = request.get_json()
    if not body:
        return jsonify({"success": False, "error": "Missing data"}), 400
    
    result = generate_pre_alert(
        region=body.get('region', 'Unknown region'),
        need_type=body.get('need_type', 'water'),
        historical_pattern=body.get('historical_pattern', 'Historical shortage patterns detected')
    )
    return jsonify(result), 200 if result['success'] else 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"PULSE X AI Service running on port {port}")
    print("Endpoints ready:")
    print("  GET  /health")
    print("  POST /analyze")
    print("  POST /cluster")
    print("  POST /match")
    print("  POST /escalate")
    app.run(host='0.0.0.0', port=port, debug=True)
    
