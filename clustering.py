from math import radians, sin, cos, sqrt, atan2
from config import (
    CLUSTER_RADIUS_KM, MAX_CLUSTER_SIZE,
    CRITICAL_THRESHOLD, HIGH_THRESHOLD, MEDIUM_THRESHOLD
)

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Returns distance in km between two coordinates.
    Used to group nearby reports into clusters.
    """
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


def cluster_reports(reports: list, radius_km: int = CLUSTER_RADIUS_KM) -> list:
    """
    Groups reports into clusters if they are:
    - Within radius_km of each other
    - Same need_type
    
    Returns list of clusters, each with:
    - cluster_id
    - need_type
    - report_ids
    - combined_urgency_score (max of group + bonus for size)
    - centroid (average lat/lon for map pin)
    - total_affected_people
    """
    if not reports:
        return []
    
    clusters = []
    assigned = set()
    
    for i, report in enumerate(reports):
        if i in assigned:
            continue
        
        cluster = {
            "cluster_id": f"cluster_{i}",
            "need_type": report["need_type"],
            "report_ids": [report["id"]],
            "urgency_scores": [report["urgency_score"]],
            "lats": [report["lat"]],
            "lons": [report["lon"]],
            "total_affected": report.get("affected_people") or 0
        }
        assigned.add(i)
        
        # Find all nearby reports with same need type
        for j, other in enumerate(reports):
            if j in assigned or j == i:
                continue
            if other["need_type"] != report["need_type"]:
                continue
            
            dist = haversine_distance(
                report["lat"], report["lon"],
                other["lat"], other["lon"]
            )
            
            if dist <= radius_km:
                cluster["report_ids"].append(other["id"])
                cluster["urgency_scores"].append(other["urgency_score"])
                cluster["lats"].append(other["lat"])
                cluster["lons"].append(other["lon"])
                cluster["total_affected"] += other.get("affected_people") or 0
                assigned.add(j)
        
        # Calculate cluster urgency: max score + size bonus
        size_bonus = min(20, (len(cluster["report_ids"]) - 1) * 5)
        cluster["combined_urgency"] = min(100, max(cluster["urgency_scores"]) + size_bonus)
        
        # Centroid for map pin
        cluster["centroid_lat"] = sum(cluster["lats"]) / len(cluster["lats"])
        cluster["centroid_lon"] = sum(cluster["lons"]) / len(cluster["lons"])
        cluster["village_count"] = len(cluster["report_ids"])
        
        # Alert level for dashboard
        score = cluster["combined_urgency"]
        if score >= CRITICAL_THRESHOLD:
            cluster["alert_level"] = "CRITICAL"
        elif score >= HIGH_THRESHOLD:
            cluster["alert_level"] = "HIGH"
        elif score >= MEDIUM_THRESHOLD:
            cluster["alert_level"] = "MEDIUM"
        else:
            cluster["alert_level"] = "LOW"
        
        clusters.append(cluster)
    
    # Sort by urgency descending so dashboard shows worst first
    return sorted(clusters, key=lambda x: x["combined_urgency"], reverse=True)


if __name__ == "__main__":
    # Test with mock reports near Telangana
    mock_reports = [
        {"id": "r1", "need_type": "water", "urgency_score": 75, "lat": 17.38, "lon": 78.48, "affected_people": 200},
        {"id": "r2", "need_type": "water", "urgency_score": 65, "lat": 17.42, "lon": 78.51, "affected_people": 150},
        {"id": "r3", "need_type": "water", "urgency_score": 80, "lat": 17.35, "lon": 78.45, "affected_people": 300},
        {"id": "r4", "need_type": "food",  "urgency_score": 60, "lat": 17.39, "lon": 78.49, "affected_people": 100},
        {"id": "r5", "need_type": "medical","urgency_score": 90, "lat": 16.50, "lon": 80.62, "affected_people": 50},
    ]
    
    clusters = cluster_reports(mock_reports)
    
    print("CLUSTERS DETECTED:")
    for c in clusters:
        print(f"\n{c['alert_level']} — {c['need_type'].upper()} cluster")
        print(f"  Villages grouped: {c['village_count']}")
        print(f"  Combined urgency: {c['combined_urgency']}/100")
        print(f"  Total affected: {c['total_affected']} people")
        print(f"  Map pin: {c['centroid_lat']:.4f}, {c['centroid_lon']:.4f}")