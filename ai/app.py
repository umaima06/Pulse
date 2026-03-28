# app.py — PULSE X AI Service
# This is the bridge between your Python brain and Person B's Node.js backend
from flask import Flask, request, jsonify
from flask_cors import CORS
from intelligence import analyze_report, escalate_urgency, get_alert_level
from clustering import cluster_reports
from matching import match_volunteers
from report_generator import generate_cluster_report, generate_pre_alert
import os
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