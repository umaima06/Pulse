from clustering import haversine_distance
from config import SKILL_MATRIX, DEFAULT_SKILLS, MAX_VOLUNTEER_MATCHES, MAX_MATCH_DISTANCE_KM

def match_volunteers(cluster: dict, volunteers: list) -> list:
    """
    Given a crisis cluster and a list of available volunteers,
    returns ranked list of best matches.
    
    Scoring:
    - Skill match: 50 points
    - Distance (closer = more points): up to 30 points
    - Availability right now: 20 points bonus
    """
    required_skills = SKILL_MATRIX.get(cluster["need_type"], DEFAULT_SKILLS)
    matches = []
    
    for vol in volunteers:
        if not vol.get("available", False):
            continue
        
        score = 0
        reasons = []
        
        # Skill match check
        vol_skills = vol.get("skills", [])
        matched_skills = [s for s in vol_skills if s in required_skills]
        if matched_skills:
            score += 50
            reasons.append(f"Skills match: {', '.join(matched_skills)}")
        else:
            # No skill match — still include but lower score
            reasons.append("No direct skill match")
        
        # Distance score (max 30 pts for <5km, 0 pts for >100km)
        dist = haversine_distance(
            vol["lat"], vol["lon"],
            cluster["centroid_lat"], cluster["centroid_lon"]
        )
        if dist <= MAX_MATCH_DISTANCE_KM:
            distance_score = max(0, 30 - int(dist * 0.3))
            score += distance_score
            reasons.append(f"{dist:.1f}km away")
        else:
            reasons.append(f"Far: {dist:.1f}km")
        
        # Immediate availability bonus
        if vol.get("available_now", False):
            score += 20
            reasons.append("Available now")
        
        matches.append({
            "volunteer_id": vol["id"],
            "name": vol["name"],
            "match_score": score,
            "distance_km": round(dist, 1),
            "matched_skills": matched_skills,
            "reasons": reasons,
            "contact": vol.get("contact")
        })
    
    # Return top 3 matches, sorted by score
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches[:MAX_VOLUNTEER_MATCHES]


if __name__ == "__main__":
    mock_cluster = {
        "need_type": "medical",
        "combined_urgency": 92,
        "centroid_lat": 17.38,
        "centroid_lon": 78.48,
        "village_count": 2,
        "total_affected": 250
    }
    
    mock_volunteers = [
        {"id": "v1", "name": "Dr. Priya Reddy", "skills": ["doctor", "first_aid"], 
         "lat": 17.40, "lon": 78.50, "available": True, "available_now": True, "contact": "+91-9876543210"},
        {"id": "v2", "name": "Rahul Singh", "skills": ["driver", "logistics"], 
         "lat": 17.45, "lon": 78.55, "available": True, "available_now": False, "contact": "+91-9876543211"},
        {"id": "v3", "name": "Nurse Fatima", "skills": ["nurse", "paramedic"], 
         "lat": 17.35, "lon": 78.42, "available": True, "available_now": True, "contact": "+91-9876543212"},
        {"id": "v4", "name": "Amit Kumar", "skills": ["teacher", "social_worker"], 
         "lat": 17.38, "lon": 78.49, "available": True, "available_now": True, "contact": "+91-9876543213"},
    ]
    
    print("VOLUNTEER MATCHING RESULTS:")
    print(f"Crisis: {mock_cluster['need_type'].upper()} | Urgency: {mock_cluster['combined_urgency']}/100")
    print(f"Location: {mock_cluster['centroid_lat']}, {mock_cluster['centroid_lon']}\n")
    
    results = match_volunteers(mock_cluster, mock_volunteers)
    for rank, match in enumerate(results, 1):
        print(f"#{rank} — {match['name']} (score: {match['match_score']}/100)")
        print(f"     Distance: {match['distance_km']}km | Skills: {match['matched_skills']}")
        print(f"     Why: {' | '.join(match['reasons'])}")