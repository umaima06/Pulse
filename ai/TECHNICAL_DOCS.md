# PULSE — Technical Documentation
## Person A: AI & Intelligence Layer

---

### Architecture Overview
```
Field Report (any language, any format)
        ↓
Groq API — llama-3.3-70b-versatile
        ↓
Structured JSON (need_type, urgency, location, summary)
        ↓
Nominatim Geocoding (OpenStreetMap)
        ↓
Real coordinates (lat/lon) for any location in India
        ↓
Clustering Algorithm (Haversine distance, 30km radius)
        ↓
Volunteer Matching (skills graph + distance + availability)
        ↓
Auto Report Generator (Groq)
        ↓
Firebase Firestore (real-time sync to dashboard)
```

---

### AI Models Used

| Model | Provider | Purpose | Why chosen |
|-------|----------|---------|------------|
| llama-3.3-70b-versatile | Groq | Report analysis, multilingual NLP, report generation | Free tier, 14400 req/day, superior multilingual performance for Indian languages |
| gemini-2.5-flash | Google | Automatic fallback if Groq fails | Ensures zero downtime on demo day |

---

### Key Technical Components

**1. Multilingual NLP Engine**
- Handles Hindi, Telugu, Tamil, English, and code-switched combinations
- Single unified prompt — no language detection step needed
- Tested with: pure Telugu, pure Hindi, Hinglish, vague inputs

**2. Urgency Scoring Algorithm**
- Base score: 50 for any report
- Medical emergency bonus: +20
- Children/elderly mentioned: +15
- Per 3 days unmet: +10
- Population > 100 affected: +10
- Partially addressed penalty: -20
- Score escalates over time — medical every 2h, water every 6h, food every 8h

**3. Geocoding**
- Uses OpenStreetMap Nominatim API
- Zero cost, no API key required
- Works for any city, district, village across all of India
- Fallback: returns India centroid if location unknown

**4. Clustering Algorithm**
- Haversine formula for accurate earth-surface distances
- Groups reports within 30km radius of same need type
- Combined urgency = max(individual scores) + size bonus (5pts per extra report)
- Size bonus capped at 20 points

**5. Volunteer Matching**
- Skill compatibility matrix per crisis type
- Scoring: skill match (50pts) + distance (up to 30pts) + availability now (20pts)
- Returns top 3 matches ranked by score
- Falls back to DEFAULT_SKILLS if crisis type not in matrix

**6. Auto Report Generator**
- Takes cluster data + individual report summaries
- Generates 3-paragraph professional NGO impact report
- Paragraph 1: Situation summary
- Paragraph 2: Human impact and urgency
- Paragraph 3: Recommended action with timeline

**7. Predictive Pre-Alert**
- Pattern-based early warning system
- Flags regions historically prone to specific crisis types
- Generates 2-sentence actionable warning for NGO coordinators

---

### API Endpoints (Flask, port 5000)

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /health | — | System status |
| POST | /analyze | {text: string} | Full structured crisis data + coordinates |
| POST | /cluster | {reports: array} | Grouped clusters with urgency scores |
| POST | /match | {cluster, volunteers} | Ranked volunteer matches |
| POST | /escalate | {reports: array} | Updated urgency scores |
| POST | /generate-report | {cluster, reports} | 3-paragraph NGO report |
| POST | /pre-alert | {region, need_type, pattern} | 2-sentence pre-alert warning |

---

### Judge Q&A Answers

**Q: Why Groq instead of Gemini directly?**
A: Gemini's free tier was exhausted during development — a real-world constraint we hit early. Groq provides 14,400 free requests per day with Llama 3.3 70B, which actually outperforms Gemini Flash on multilingual Indian language understanding. We kept Gemini as automatic fallback, so the system never goes down. This dual-provider architecture is production-grade thinking — if one provider has an outage, the other takes over instantly.

**Q: How accurate is urgency scoring?**
A: The scoring combines two layers. First, Groq extracts factual signals from the message — days unmet, population size, presence of children or elderly, medical emergency indicators. Second, our rule-based engine applies weighted bonuses from config.py. We validated against 20+ real-world crisis scenarios. The escalation system means even a correctly scored 65 becomes CRITICAL after 48 hours unaddressed — which is the right behavior. Confidence scores below 0.5 flag reports for human review.

**Q: How does the system handle fake or malicious reports?**
A: Three layers of protection. First, confidence scoring — vague or inconsistent reports get confidence below 0.5 and are flagged. Second, clustering — a single outlier report doesn't trigger volunteer dispatch; it needs corroboration from nearby reports. Third, all reports are stored with sender phone number, so patterns of abuse are traceable. In production, we'd add phone number verification via OTP.

**Q: Can this scale to handle thousands of reports?**
A: Yes. Firebase Firestore scales horizontally automatically. Our Flask server is stateless — it can be deployed behind a load balancer with multiple instances on GCP Cloud Run. Groq's API handles concurrent requests natively. The clustering algorithm is O(n²) in the worst case, but with geographic sharding by state it becomes effectively O(k²) where k is reports per region — manageable at any realistic scale.

**Q: What happens when there's no internet in rural areas?**
A: The intake layer — Twilio WhatsApp — works on 2G. The field worker only needs to send a message. All intelligence runs server-side. For zero-connectivity situations, the system is designed to accept SMS as input, which works on basic phones with no data. The AI processing happens entirely on our servers, not on the field worker's device.

**Q: Why not just use one AI model for everything?**
A: Different tasks need different characteristics. Report analysis needs consistency and low temperature — Groq excels here. Report generation needs creative, professional writing — Groq's 70B model produces better prose than smaller models. The fallback to Gemini ensures we're never dependent on a single provider. This is how production AI systems are actually built.

**Q: How does volunteer matching work at scale?**
A: It's a bipartite matching problem. For each CRITICAL cluster, we query only available volunteers within 100km. We score each on three dimensions — skill match (50 points), distance (up to 30 points), immediate availability (20 points). Top 3 are returned. In production with thousands of volunteers, we'd add geohash-based pre-filtering to query only volunteers in the relevant geographic cell, making it O(1) lookup instead of O(n).