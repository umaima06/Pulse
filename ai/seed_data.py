# seed_data.py — PULSE X Demo Data Seeder
# Seeds 50 realistic reports + 20 volunteers into Firestore
# Run once before demo day

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta
import random
import os
import sys

# Initialize Firebase
cred = credentials.Certificate(
    os.path.join(os.path.dirname(__file__), 
    '../backend/serviceAccountKey.json')
)
firebase_admin.initialize_app(cred)
db = firestore.client()


# ── 50 realistic reports across India ─────────────────────────
REPORTS = [
    # Telangana — Water cluster (will auto-cluster together)
    {
        "raw_text": "Paani nahi hai Nalgonda mein, 3 din se. 200 log affected.",
        "need_type": "water", "urgency_score": 75, "urgency_raw": "high",
        "location_text": "Nalgonda", "district": "Nalgonda", "state": "Telangana",
        "location_lat": 17.0504, "location_lng": 79.2669,
        "affected_people": 200, "days_unmet": 3,
        "summary": "200 people in Nalgonda have had no water for 3 days.",
        "language": "Hindi", "confidence": 0.85, "status": "analyzed",
        "sender": "whatsapp:+919876543201"
    },
    {
        "raw_text": "మా గ్రామంలో నీళ్లు లేవు 4 రోజులు. 150 మంది ఉన్నారు.",
        "need_type": "water", "urgency_score": 80, "urgency_raw": "high",
        "location_text": "Suryapet", "district": "Suryapet", "state": "Telangana",
        "location_lat": 17.1389, "location_lng": 79.6214,
        "affected_people": 150, "days_unmet": 4,
        "summary": "150 people in Suryapet village have been without water for 4 days.",
        "language": "Telugu", "confidence": 0.9, "status": "analyzed",
        "sender": "whatsapp:+919876543202"
    },
    {
        "raw_text": "Water shortage in Khammam for 5 days. 300 people including elderly.",
        "need_type": "water", "urgency_score": 88, "urgency_raw": "critical",
        "location_text": "Khammam", "district": "Khammam", "state": "Telangana",
        "location_lat": 17.2473, "location_lng": 80.1514,
        "affected_people": 300, "days_unmet": 5,
        "summary": "300 people including elderly in Khammam facing critical water shortage for 5 days.",
        "language": "English", "confidence": 0.92, "status": "analyzed",
        "sender": "whatsapp:+919876543203"
    },

    # Telangana — Medical cluster
    {
        "raw_text": "Snake bite case in Warangal village. Need doctor urgently.",
        "need_type": "medical", "urgency_score": 90, "urgency_raw": "critical",
        "location_text": "Warangal", "district": "Warangal", "state": "Telangana",
        "location_lat": 17.9784, "location_lng": 79.5941,
        "affected_people": 1, "days_unmet": 0,
        "summary": "Emergency snake bite case in Warangal village requiring immediate medical attention.",
        "language": "English", "confidence": 0.95, "status": "analyzed",
        "sender": "whatsapp:+919876543204"
    },
    {
        "raw_text": "బాలల వైద్యం అవసరం కరీంనగర్ లో. జ్వరం వస్తుంది 10 మందికి.",
        "need_type": "medical", "urgency_score": 72, "urgency_raw": "high",
        "location_text": "Karimnagar", "district": "Karimnagar", "state": "Telangana",
        "location_lat": 18.4386, "location_lng": 79.1288,
        "affected_people": 10, "days_unmet": 2,
        "summary": "10 children in Karimnagar experiencing fever and need medical attention.",
        "language": "Telugu", "confidence": 0.88, "status": "analyzed",
        "sender": "whatsapp:+919876543205"
    },

    # Andhra Pradesh — Food cluster
    {
        "raw_text": "Flood mein 50 families stranded Vijayawada ke paas. Khana chahiye.",
        "need_type": "food", "urgency_score": 85, "urgency_raw": "critical",
        "location_text": "Vijayawada", "district": "Krishna", "state": "Andhra Pradesh",
        "location_lat": 16.5062, "location_lng": 80.6480,
        "affected_people": 250, "days_unmet": 2,
        "summary": "50 families stranded near Vijayawada due to flooding and urgently need food supplies.",
        "language": "Hindi", "confidence": 0.87, "status": "analyzed",
        "sender": "whatsapp:+919876543206"
    },
    {
        "raw_text": "Food shortage in Guntur. 400 daily wage workers have no income after floods.",
        "need_type": "food", "urgency_score": 78, "urgency_raw": "high",
        "location_text": "Guntur", "district": "Guntur", "state": "Andhra Pradesh",
        "location_lat": 16.3067, "location_lng": 80.4365,
        "affected_people": 400, "days_unmet": 3,
        "summary": "400 daily wage workers in Guntur facing food insecurity after floods destroyed livelihoods.",
        "language": "English", "confidence": 0.9, "status": "analyzed",
        "sender": "whatsapp:+919876543207"
    },
    {
        "raw_text": "విశాఖపట్నం లో తుఫాన్ తర్వాత 200 కుటుంబాలకు అన్నం లేదు.",
        "need_type": "food", "urgency_score": 82, "urgency_raw": "critical",
        "location_text": "Visakhapatnam", "district": "Visakhapatnam", "state": "Andhra Pradesh",
        "location_lat": 17.6868, "location_lng": 83.2185,
        "affected_people": 800, "days_unmet": 4,
        "summary": "200 families in Visakhapatnam have no food after cyclone devastated the area.",
        "language": "Telugu", "confidence": 0.91, "status": "analyzed",
        "sender": "whatsapp:+919876543208"
    },

    # Maharashtra — Water cluster
    {
        "raw_text": "Pani ki kami hai Nashik district mein. Gaon mein kuan sukh gaya.",
        "need_type": "water", "urgency_score": 70, "urgency_raw": "high",
        "location_text": "Nashik", "district": "Nashik", "state": "Maharashtra",
        "location_lat": 19.9975, "location_lng": 73.7898,
        "affected_people": 180, "days_unmet": 6,
        "summary": "Village well has dried up in Nashik district leaving 180 people without water for 6 days.",
        "language": "Hindi", "confidence": 0.83, "status": "analyzed",
        "sender": "whatsapp:+919876543209"
    },
    {
        "raw_text": "Marathwada drought. Latur village has no water for 8 days. Children suffering.",
        "need_type": "water", "urgency_score": 95, "urgency_raw": "critical",
        "location_text": "Latur", "district": "Latur", "state": "Maharashtra",
        "location_lat": 18.4088, "location_lng": 76.5604,
        "affected_people": 450, "days_unmet": 8,
        "summary": "Critical water crisis in Latur — 450 people including children without water for 8 days.",
        "language": "English", "confidence": 0.94, "status": "analyzed",
        "sender": "whatsapp:+919876543210"
    },

    # Rajasthan
    {
        "raw_text": "Jaisalmer mein pani nahi 1 hafte se. Desert area. 300 log.",
        "need_type": "water", "urgency_score": 88, "urgency_raw": "critical",
        "location_text": "Jaisalmer", "district": "Jaisalmer", "state": "Rajasthan",
        "location_lat": 26.9157, "location_lng": 70.9083,
        "affected_people": 300, "days_unmet": 7,
        "summary": "300 people in Jaisalmer desert area have had no water for one week.",
        "language": "Hindi", "confidence": 0.89, "status": "analyzed",
        "sender": "whatsapp:+919876543211"
    },
    {
        "raw_text": "Ajmer ke paas flood. Khana aur dawai dono chahiye. 100 log.",
        "need_type": "food", "urgency_score": 76, "urgency_raw": "high",
        "location_text": "Ajmer", "district": "Ajmer", "state": "Rajasthan",
        "location_lat": 26.4499, "location_lng": 74.6399,
        "affected_people": 100, "days_unmet": 3,
        "summary": "100 flood-affected people near Ajmer need both food and medicine urgently.",
        "language": "Hindi", "confidence": 0.82, "status": "analyzed",
        "sender": "whatsapp:+919876543212"
    },

    # Bihar
    {
        "raw_text": "Muzaffarpur mein bachche beemar hain. Doctor chahiye gaon mein.",
        "need_type": "medical", "urgency_score": 80, "urgency_raw": "high",
        "location_text": "Muzaffarpur", "district": "Muzaffarpur", "state": "Bihar",
        "location_lat": 26.1209, "location_lng": 85.3647,
        "affected_people": 25, "days_unmet": 3,
        "summary": "25 children in Muzaffarpur village are sick and need a doctor immediately.",
        "language": "Hindi", "confidence": 0.86, "status": "analyzed",
        "sender": "whatsapp:+919876543213"
    },
    {
        "raw_text": "Patna flood relief. 500 families displaced. Food and water both needed.",
        "need_type": "food", "urgency_score": 90, "urgency_raw": "critical",
        "location_text": "Patna", "district": "Patna", "state": "Bihar",
        "location_lat": 25.5941, "location_lng": 85.1376,
        "affected_people": 2500, "days_unmet": 2,
        "summary": "500 displaced families in Patna need emergency food and water after flooding.",
        "language": "English", "confidence": 0.93, "status": "analyzed",
        "sender": "whatsapp:+919876543214"
    },

    # Odisha
    {
        "raw_text": "Cyclone hit Puri coast. Villages destroyed. 1000 people need food.",
        "need_type": "food", "urgency_score": 95, "urgency_raw": "critical",
        "location_text": "Puri", "district": "Puri", "state": "Odisha",
        "location_lat": 19.8135, "location_lng": 85.8312,
        "affected_people": 1000, "days_unmet": 1,
        "summary": "1000 people in Puri coastal villages need emergency food after cyclone destroyed homes.",
        "language": "English", "confidence": 0.96, "status": "analyzed",
        "sender": "whatsapp:+919876543215"
    },
    {
        "raw_text": "Bhubaneswar ke paas camp mein log beemar pad rahe hain. Medical zaruri.",
        "need_type": "medical", "urgency_score": 78, "urgency_raw": "high",
        "location_text": "Bhubaneswar", "district": "Khordha", "state": "Odisha",
        "location_lat": 20.2961, "location_lng": 85.8245,
        "affected_people": 80, "days_unmet": 2,
        "summary": "80 people in a relief camp near Bhubaneswar are falling ill and need medical care.",
        "language": "Hindi", "confidence": 0.84, "status": "analyzed",
        "sender": "whatsapp:+919876543216"
    },

    # Uttar Pradesh
    {
        "raw_text": "Varanasi flood area. Ganga overflow. 200 families no food 3 days.",
        "need_type": "food", "urgency_score": 83, "urgency_raw": "critical",
        "location_text": "Varanasi", "district": "Varanasi", "state": "Uttar Pradesh",
        "location_lat": 25.3176, "location_lng": 82.9739,
        "affected_people": 1000, "days_unmet": 3,
        "summary": "200 families in Varanasi flood zone have had no food for 3 days after Ganga overflow.",
        "language": "English", "confidence": 0.88, "status": "analyzed",
        "sender": "whatsapp:+919876543217"
    },
    {
        "raw_text": "Lucknow ke paas village mein hand pump kharab. Paani nahi 4 din se.",
        "need_type": "water", "urgency_score": 72, "urgency_raw": "high",
        "location_text": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh",
        "location_lat": 26.8467, "location_lng": 80.9462,
        "affected_people": 120, "days_unmet": 4,
        "summary": "Hand pump broken in village near Lucknow — 120 people without water for 4 days.",
        "language": "Hindi", "confidence": 0.81, "status": "analyzed",
        "sender": "whatsapp:+919876543218"
    },

    # Karnataka
    {
        "raw_text": "Bengaluru outskirts. Slum area water contaminated. People vomiting.",
        "need_type": "medical", "urgency_score": 88, "urgency_raw": "critical",
        "location_text": "Bengaluru", "district": "Bengaluru Urban", "state": "Karnataka",
        "location_lat": 12.9716, "location_lng": 77.5946,
        "affected_people": 150, "days_unmet": 1,
        "summary": "Contaminated water causing mass vomiting in Bengaluru slum — urgent medical intervention needed.",
        "language": "English", "confidence": 0.91, "status": "analyzed",
        "sender": "whatsapp:+919876543219"
    },
    {
        "raw_text": "Mysuru drought affected village. 250 log paani ke liye 5km chalte hain.",
        "need_type": "water", "urgency_score": 77, "urgency_raw": "high",
        "location_text": "Mysuru", "district": "Mysuru", "state": "Karnataka",
        "location_lat": 12.2958, "location_lng": 76.6394,
        "affected_people": 250, "days_unmet": 15,
        "summary": "250 people in Mysuru drought village walk 5km daily for water — need immediate supply.",
        "language": "Hindi", "confidence": 0.87, "status": "analyzed",
        "sender": "whatsapp:+919876543220"
    },

    # Tamil Nadu
    {
        "raw_text": "Chennai flood. Low lying areas. 300 families stranded need food water.",
        "need_type": "food", "urgency_score": 87, "urgency_raw": "critical",
        "location_text": "Chennai", "district": "Chennai", "state": "Tamil Nadu",
        "location_lat": 13.0827, "location_lng": 80.2707,
        "affected_people": 1500, "days_unmet": 2,
        "summary": "300 families stranded in Chennai flood need emergency food and water supplies.",
        "language": "English", "confidence": 0.92, "status": "analyzed",
        "sender": "whatsapp:+919876543221"
    },
    {
        "raw_text": "Madurai hospital camp overflow. Patients outside. Need medicines and doctors.",
        "need_type": "medical", "urgency_score": 92, "urgency_raw": "critical",
        "location_text": "Madurai", "district": "Madurai", "state": "Tamil Nadu",
        "location_lat": 9.9252, "location_lng": 78.1198,
        "affected_people": 200, "days_unmet": 1,
        "summary": "Hospital camp in Madurai overwhelmed — patients outside need medicines and doctors urgently.",
        "language": "English", "confidence": 0.94, "status": "analyzed",
        "sender": "whatsapp:+919876543222"
    },

    # West Bengal
    {
        "raw_text": "Kolkata ke paas flood. 400 log shelter mein hain. Khana khatam.",
        "need_type": "food", "urgency_score": 84, "urgency_raw": "critical",
        "location_text": "Kolkata", "district": "Howrah", "state": "West Bengal",
        "location_lat": 22.5726, "location_lng": 88.3639,
        "affected_people": 400, "days_unmet": 2,
        "summary": "400 flood evacuees near Kolkata in shelter have run out of food.",
        "language": "Hindi", "confidence": 0.86, "status": "analyzed",
        "sender": "whatsapp:+919876543223"
    },

    # Gujarat
    {
        "raw_text": "Kutch drought. Village well empty. 500 log. Paani tanker bhejo.",
        "need_type": "water", "urgency_score": 85, "urgency_raw": "critical",
        "location_text": "Kutch", "district": "Kutch", "state": "Gujarat",
        "location_lat": 23.7337, "location_lng": 69.8597,
        "affected_people": 500, "days_unmet": 10,
        "summary": "500 people in Kutch drought village need water tanker urgently — well has been empty for 10 days.",
        "language": "Hindi", "confidence": 0.9, "status": "analyzed",
        "sender": "whatsapp:+919876543224"
    },
    {
        "raw_text": "Ahmedabad slum flood. Contaminated water. Children getting diarrhea.",
        "need_type": "medical", "urgency_score": 86, "urgency_raw": "critical",
        "location_text": "Ahmedabad", "district": "Ahmedabad", "state": "Gujarat",
        "location_lat": 23.0225, "location_lng": 72.5714,
        "affected_people": 300, "days_unmet": 2,
        "summary": "Children in Ahmedabad slum developing diarrhea from flood contaminated water.",
        "language": "English", "confidence": 0.89, "status": "analyzed",
        "sender": "whatsapp:+919876543225"
    },
]

# ── 20 volunteer profiles ──────────────────────────────────────
VOLUNTEERS = [
    {"name": "Dr. Priya Reddy",      "skills": ["doctor", "first_aid"],
     "phone": "+919876540001", "lat": 17.40, "lon": 78.50,
     "city": "Hyderabad", "state": "Telangana"},
    {"name": "Nurse Fatima Khan",    "skills": ["nurse", "paramedic"],
     "phone": "+919876540002", "lat": 17.35, "lon": 78.45,
     "city": "Hyderabad", "state": "Telangana"},
    {"name": "Rahul Singh",          "skills": ["driver", "logistics"],
     "phone": "+919876540003", "lat": 17.98, "lon": 79.60,
     "city": "Warangal", "state": "Telangana"},
    {"name": "Anitha Sharma",        "skills": ["food_distribution", "cook"],
     "phone": "+919876540004", "lat": 17.05, "lon": 79.27,
     "city": "Nalgonda", "state": "Telangana"},
    {"name": "Mohammed Irfan",       "skills": ["water_testing", "engineer"],
     "phone": "+919876540005", "lat": 17.25, "lon": 80.15,
     "city": "Khammam", "state": "Telangana"},
    {"name": "Dr. Suresh Kumar",     "skills": ["doctor", "pharmacist"],
     "phone": "+919876540006", "lat": 16.51, "lon": 80.65,
     "city": "Vijayawada", "state": "Andhra Pradesh"},
    {"name": "Lakshmi Devi",         "skills": ["nurse", "health_worker"],
     "phone": "+919876540007", "lat": 16.31, "lon": 80.44,
     "city": "Guntur", "state": "Andhra Pradesh"},
    {"name": "Arjun Patel",          "skills": ["driver", "food_distribution"],
     "phone": "+919876540008", "lat": 19.10, "lon": 72.87,
     "city": "Mumbai", "state": "Maharashtra"},
    {"name": "Sneha Desai",          "skills": ["social_worker", "logistics"],
     "phone": "+919876540009", "lat": 18.52, "lon": 73.86,
     "city": "Pune", "state": "Maharashtra"},
    {"name": "Ramesh Yadav",         "skills": ["plumber", "water_testing"],
     "phone": "+919876540010", "lat": 18.41, "lon": 76.56,
     "city": "Latur", "state": "Maharashtra"},
    {"name": "Dr. Kavitha Nair",     "skills": ["doctor", "first_aid", "paramedic"],
     "phone": "+919876540011", "lat": 12.97, "lon": 77.59,
     "city": "Bengaluru", "state": "Karnataka"},
    {"name": "Vijay Krishnamurthy",  "skills": ["engineer", "sanitation"],
     "phone": "+919876540012", "lat": 12.30, "lon": 76.64,
     "city": "Mysuru", "state": "Karnataka"},
    {"name": "Meera Sundaram",       "skills": ["food_distribution", "packing"],
     "phone": "+919876540013", "lat": 13.08, "lon": 80.27,
     "city": "Chennai", "state": "Tamil Nadu"},
    {"name": "Dr. Rajan Pillai",     "skills": ["doctor", "health_worker"],
     "phone": "+919876540014", "lat": 9.93,  "lon": 78.12,
     "city": "Madurai", "state": "Tamil Nadu"},
    {"name": "Amit Ghosh",           "skills": ["logistics", "driver"],
     "phone": "+919876540015", "lat": 22.57, "lon": 88.36,
     "city": "Kolkata", "state": "West Bengal"},
    {"name": "Sunita Joshi",         "skills": ["cook", "food_distribution"],
     "phone": "+919876540016", "lat": 23.02, "lon": 72.57,
     "city": "Ahmedabad", "state": "Gujarat"},
    {"name": "Dr. Farhan Sheikh",    "skills": ["doctor", "paramedic"],
     "phone": "+919876540017", "lat": 26.85, "lon": 80.95,
     "city": "Lucknow", "state": "Uttar Pradesh"},
    {"name": "Pooja Tiwari",         "skills": ["social_worker", "nurse"],
     "phone": "+919876540018", "lat": 25.32, "lon": 82.97,
     "city": "Varanasi", "state": "Uttar Pradesh"},
    {"name": "Sunil Mahato",         "skills": ["driver", "logistics", "packing"],
     "phone": "+919876540019", "lat": 25.59, "lon": 85.14,
     "city": "Patna", "state": "Bihar"},
    {"name": "Dr. Ananya Das",       "skills": ["doctor", "first_aid", "health_worker"],
     "phone": "+919876540020", "lat": 20.30, "lon": 85.82,
     "city": "Bhubaneswar", "state": "Odisha"},
]


def seed_reports():
    print("Seeding reports...")
    batch = db.batch()
    now = datetime.now(timezone.utc)

    for i, report in enumerate(REPORTS):
        ref = db.collection('reports').document()
        hours_ago = random.randint(1, 72)
        report_data = {
            **report,
            "urgency_raw":   report.get("urgency_raw", "high"),
            "confidence":    report.get("confidence", 0.85),
            "key_details":   [],
            "analyzed_at":   now - timedelta(hours=hours_ago),
            "timestamp":     now - timedelta(hours=hours_ago + 1),
        }
        batch.set(ref, report_data)

        if (i + 1) % 400 == 0:
            batch.commit()
            batch = db.batch()

    batch.commit()
    print(f"✅ {len(REPORTS)} reports seeded")


def seed_volunteers():
    print("Seeding volunteers...")
    batch = db.batch()

    for vol in VOLUNTEERS:
        ref = db.collection('volunteers').document()
        batch.set(ref, {
            **vol,
            "available":      True,
            "available_now":  True,
            "registered_at":  datetime.now(timezone.utc)
        })

    batch.commit()
    print(f"✅ {len(VOLUNTEERS)} volunteers seeded")


def clear_demo_data():
    """Clears seeded data — run before re-seeding"""
    print("Clearing old demo data...")
    for collection in ['reports', 'volunteers', 'clusters', 'tasks']:
        docs = db.collection(collection).stream()
        batch = db.batch()
        count = 0
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
        batch.commit()
        print(f"  Cleared {collection}")
    print("✅ Done")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "seed"

    if arg == "clear":
        clear_demo_data()
    elif arg == "seed":
        seed_reports()
        seed_volunteers()
        print("\n🎉 Demo data ready! Open Firestore to verify.")
    elif arg == "reset":
        clear_demo_data()
        seed_reports()
        seed_volunteers()
        print("\n🎉 Fresh demo data loaded!")