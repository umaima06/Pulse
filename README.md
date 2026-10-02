# PULSE — AI-Powered Crisis Coordination for NGOs

> *Turning scattered field reports into real-time, automated community crisis response.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pulse--11de7.web.app-blue)](https://pulse-11de7.web.app/)
![Backend](https://img.shields.io/badge/Backend-Render-green)
![AI Service](https://img.shields.io/badge/AI%20Service-Render-purple)
[![GitHub](https://img.shields.io/badge/GitHub-Public%20Repo-yellow)](https://github.com/umaima06/Pulse)
![Status](https://img.shields.io/badge/Status-Live%20%26%20Deployed-brightgreen)
![SDG](https://img.shields.io/badge/UN%20SDG-11.5%20%7C%201.5%20%7C%203.8-blue)

---

## 🌍 UN SDG Alignment

PULSE is built in direct response to three United Nations Sustainable Development Goals:

| SDG | How PULSE Contributes |
|---|---|
| **SDG 11.5** — Disaster response | Cuts dispatch from 4–6 hours to 30 seconds — the window where lives are lost |
| **SDG 1.5** — Climate resilience | Serves zero-literacy, zero-English users through IVR and WhatsApp on 2G |
| **SDG 3.8** — Healthcare access | Medical emergencies routed to skilled volunteers automatically |

> This is what we built PULSE for.

---

## ⚠️ The Problem

NGOs working in rural and semi-urban India face a coordination crisis that technology has largely ignored.

Field workers send WhatsApp messages about water shortages, food insecurity, and medical emergencies — in Hindi, Telugu, Tamil, and a dozen other languages. These messages land in group chats, get buried, and never reach the right person in time. Volunteers are available but have no idea where to go. NGO coordinators are overwhelmed, manually reading reports, making phone calls, and tracking tasks on spreadsheets.

**By the numbers:**
- 3.3 million registered NGOs in India — fewer than 10% use any coordination software
- During the 2023 Odisha floods, relief duplication wasted an estimated 40% of volunteer hours
- 78% of India's disaster-affected population communicates only in regional languages
- Average time from crisis report to volunteer dispatch in manual NGO workflows: **4–6 hours**
- PULSE average dispatch time: **under 30 seconds**

The result: **communities that need help the most wait the longest.**

The core failures are:
- **Fragmentation** — reports come through WhatsApp, SMS, and phone calls with no central system
- **Language barriers** — most tools require English; field workers operate in regional languages
- **No prioritization** — all crises are treated equally, regardless of severity or scale
- **Manual coordination** — every volunteer assignment requires a human to read, decide, and call
- **No accountability** — once a volunteer is sent, there is no way to verify the task was completed
- **Delayed response** — by the time data is organized, the crisis has worsened

---

## 💡 What is PULSE?

PULSE is a fully deployed, end-to-end AI coordination platform built specifically for NGOs operating in India.

A field worker sends one message — in any language, on any device — via WhatsApp, SMS, IVR voice call, or the browser-based Vapi voice agent. PULSE receives it, understands it using AI, scores its urgency, geocodes the location, and automatically assigns the nearest skilled volunteer. The entire chain happens in seconds, with zero manual intervention.

The NGO Admin monitors everything on a live Google Maps dashboard — color-coded crisis clusters, volunteer assignments, predictive alerts, and AI-generated impact reports — all updating in real time.

**Three teammates. Three deployed microservices. One working product.**

---

## 🔗 Live Links

| Resource | URL |
|---|---|
| 🌐 Frontend | https://pulse-11de7.web.app |
| 📞 Vapi Voice Line | +1 (803) 879 1375 |
| 💻 GitHub | https://github.com/umaima06/Pulse |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| NGO Admin | demo@pulse.app | pulse2026 |

> After login, click **"Fire Demo"** on the dashboard to instantly populate the map with live crisis clusters.

---

## ⚡ End-to-End Pipeline

```
Field Worker (WhatsApp / SMS / IVR / Vapi Browser / Vapi Phone / Bot / Manual Form)
↓
Express Backend — saves report to Firestore instantly
↓
Flask AI Microservice — analyzes report:
crisis type + urgency score (1–100) + GPS coordinates + language + summary
↓
Clustering Engine — groups nearby same-type reports (Haversine, 30km radius)
↓
If urgency ≥ 80 → Auto-assign nearest skilled volunteer
If urgency < 80 → NGO Admin assigns from live dashboard
↓
Volunteer receives WhatsApp + SMS with task details + Google Maps link
↓
Volunteer replies ACCEPT / DONE / DECLINE → Firestore updates instantly
↓
Volunteer submits proof photo → Gemini Vision verifies authenticity
↓
NGO Admin marks cluster Resolved → resolution note + timestamp stored
↓
Hourly cron escalates urgency on unresolved clusters over time
```

---

## 📖 Usage Examples

**Reporting via WhatsApp:**
Send any message to the PULSE WhatsApp number in any language.
- Vague message: `"help chahiye"` → bot guides you through 4 steps
- Detailed message: `"3 din se paani nahi, Abids mein, 50 log hain"` → goes directly to AI analysis
- Response time: under 30 seconds from message to volunteer assigned

**Reporting via Vapi Voice Agent (browser):**
Open https://pulse-11de7.web.app → tap the mic button → speak your crisis report in any language → done. No phone required. Transcript is analyzed by AI and saved to Firestore automatically.

**Reporting via Vapi Phone:**
Call `+1 (803) 879 1375` from any phone. The PULSE Crisis Reporter AI assistant answers, collects the report conversationally, and routes it through the full AI pipeline.

**Reporting via IVR:**
Call the PULSE number → select language (1–4) → press crisis type (1/2/3) → speak your 30-second report → done. Zero smartphone literacy required.

**NGO Admin workflow:**
1. Open https://pulse-11de7.web.app and log in
2. Watch crisis clusters appear live on the Google Maps dashboard
3. Click any cluster → view urgency score, affected people, location
4. Assign volunteer → WhatsApp + SMS sent automatically with Google Maps link
5. Track: Assigned → Accepted → Proof Awaiting → Verified → Resolved

**Volunteer workflow:**
1. Visit https://pulse-11de7.web.app/my-tasks
2. Enter your phone number — no login required
3. Toggle availability On Duty / Off Duty
4. Receive WhatsApp task notification → reply ACCEPT
5. Complete task → reply DONE → submit proof photo
6. AI verifies photo → task marked complete automatically

---

## 🚀 Features

### 📥 Intake & Reporting

- **5-channel multilingual intake** — WhatsApp, SMS, IVR voice call, Vapi browser voice agent, and manual intake form. Supports Hindi, Telugu, Tamil, Marathi, Bengali, Urdu, and English. Works on any device, any connectivity level.
- **WhatsApp Conversational Bot** — detects vague messages ("help", "problem hai") and guides field workers through a 4-step conversation: crisis type → people affected → days unmet → location. Automatically detects and responds in the user's language. Sessions expire after 30 minutes.
- **Smart message classification** — detailed messages skip the bot entirely and go straight to AI processing. Only vague or incomplete messages trigger the guided flow.
- **IVR Voice System** — field worker calls the PULSE number, selects preferred language, presses 1 (water) / 2 (food) / 3 (medical), and records a 30-second voice report. Zero smartphone literacy required.
- **Multilingual IVR** — caller selects from Hindi, Telugu, Tamil, or English. Voice menu and prompts dynamically adapt to the selected language.
- **Vapi Voice Agent (browser)** — embedded mic button on the landing page. Tap once, speak your crisis report in any language directly from the browser — no phone call required. Transcript is sent to the backend via `/vapi-webhook`, analyzed by AI, and saved to Firestore automatically.
- **Vapi Phone Line** — call `+1 (803) 879 1375` directly from any phone. The PULSE Crisis Reporter AI assistant answers, collects the report via natural conversation, and routes it through the full AI pipeline.
- **Manual intake form** — NGO coordinators can log crises directly via the dashboard. Calls the AI microservice, shows urgency score and summary immediately, and saves enriched data to Firestore.

---

### 🧠 AI Intelligence Layer

- **Groq + Gemini Crisis Analysis** — converts any raw text in any Indian language into structured JSON: crisis type (water / food / medical), urgency score (1–100), GPS coordinates, detected language, and a plain-English summary. Primary model: Groq LLaMA 3.3 70B. Automatic fallback: Gemini 2.5 Flash if Groq is unavailable.
- **OpenStreetMap Nominatim Geocoding** — converts any location text ("Abids, Hyderabad", "near the railway station in Warangal") into real latitude and longitude coordinates. Free, no API key required, full India coverage.
- **Smart Crisis Clustering** — groups nearby same-type reports within a 30km radius into one cluster using the Haversine distance formula. Calculates combined urgency score and total affected population per cluster. Prevents duplicate volunteer deployments.
- **Volunteer Matching Algorithm** — ranks all available volunteers by skill match, distance from the cluster, and current availability. Auto-assigns the top match when cluster urgency reaches 80 or above.
- **Urgency Escalation** — an hourly cron job automatically increases urgency scores for clusters that remain unresolved over time. Prevents neglected crises from staying low-priority indefinitely.
- **Predictive Alert System** — analyzes historical Firestore data by region, crisis type, and month to forecast upcoming crises. Sends early WhatsApp warnings to the NGO admin with HIGH / MEDIUM / LOW confidence ratings. Runs on server startup and daily thereafter.
- **AI Impact Report Generation** — converts any cluster's data into a professional 3-paragraph NGO impact report using Groq LLaMA 3.3 70B. Available on demand from the dashboard with a copy-to-clipboard button.
- **AI Proof Verification (Gemini Vision)** — when a volunteer submits a completion photo, Gemini Vision runs three checks: (1) does the image show activity relevant to the assigned task type? (2) is it a real field photo and not a stock or reused image? (3) does the scene match a plausible crisis context in India? All three must pass before the task is marked complete. High fraud risk → rejected, volunteer asked to resubmit.
- **AI Chatbot Assistant** — intent-based chatbot with 5 modes: reporting, analytics, predictive alerts, info, and Groq LLM fallback for free-form queries.

---

### 🤝 Volunteer Coordination

- **Dual notifications (WhatsApp + SMS simultaneously)** — every assignment sends both channels at once. Message includes crisis type, location, people affected, summary, and a direct Google Maps navigation link.
- **WhatsApp reply handling** — volunteers reply ACCEPT, DONE, or DECLINE. All updates fire to Firestore in real time. DECLINE triggers auto-reassignment to the next best match.
- **NGO Cluster Action Controls** — Assign, Reassign, Force-Assign, or Mark Resolved with a custom resolution note. All actions trigger instant WhatsApp notifications.
- **Task lifecycle tracking** — full status flow: Assigned → Accepted → Proof Awaiting → Proof Verified → Resolved. Every transition is timestamped.
- **Response delay tracking** — color-coded indicators (green / yellow / red) per task. "Days unmet" metric shows how long a crisis has been unresolved.
- **Volunteer availability toggle** — On Duty / Off Duty from the volunteer portal. Automatically flips to unavailable on task accept, back to available on completion.
- **Resolution notes** — custom note on cluster close, stored with `resolved_at` timestamp.

---

### 🗺️ NGO Dashboard & Frontend

- **Live Google Maps Dashboard** — real-time cluster visualization with color-coded urgency markers: 🔴 Red (critical, 80+), 🟠 Orange (high, 50–79), 🟡 Yellow (medium), 🔵 Blue (individual report). Clusters show report count as labels.
- **Live Volunteer Map (Landing Page)** — SVG-based India map showing active volunteer locations across 8 cities (Delhi, Mumbai, Hyderabad, Kolkata, Bhopal, Chennai, Ahmedabad, Bangalore). Active volunteers show animated pulse rings. Standby volunteers shown as static dots. Updates live alongside the impact counters.
- **Cluster detail panel** — click any cluster to view need type, affected people, days unmet, assigned volunteer, response status, and all NGO action buttons.
- **Live feed sidebar** — real-time stream of incoming reports via Firestore onSnapshot. Pulsing green dot indicates live data.
- **Predictive alerts banner** — AI-generated upcoming crisis warnings across the top of the dashboard.
- **One-click demo trigger** — "Fire Demo" button places realistic crisis reports on the live map instantly.
- **10-page application** — Landing, Login, Dashboard, Reports, Tasks, Volunteers, Analytics, Intake, Volunteer Registration, Volunteer Portal.
- **Analytics page** — live system stats: total reports, volunteers, clusters, tasks, crisis type breakdown, severity distribution, people helped counter, task completion progress bars.
- **Reports page** — all field reports with urgency scores, language tags, need type badges, timestamps.
- **Tasks page** — full assignment tracker with proof images and Gemini Vision verification results per card.
- **Volunteer Portal (/my-tasks)** — no login required. Phone number lookup returns all tasks via onSnapshot. Availability toggle, accept/complete buttons, one-tap Google Maps directions.
- **Route protection** — all dashboard pages redirect to `/login` if unauthenticated. Powered by Firebase Auth.
- **Mobile-responsive navbar** — hamburger menu, active link highlights, org name display, logout.

---

### 🏢 NGO & System Management

- **NGO registration and login** — Firebase Auth with email/password. Organization name saved on register and displayed in the navbar.
- **Multi-NGO data isolation** — every report, volunteer, cluster, and task tagged with `ngo_id`. NGO-scoped endpoints ensure each NGO sees only their own data.
- **Token verification middleware** — all protected backend routes verify Firebase Auth tokens before processing.
- **Analytics endpoint** — `/analytics` returns full live system stats from Firestore.

---

### 🌐 Multilingual Frontend (i18n)

- Full 7-language support across all 10 pages: English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Marathi (मराठी), Bengali (বাংলা), Urdu (اُردُو)
- Reusable `LanguageSwitcher` component in Navbar, Landing, Login, and RoleSelect
- `useTranslation()` hook applied across every page — all labels, buttons, headings, error messages, and status indicators are translated
- Language switches globally and instantly with zero page reload
- `en.json` is the master reference. Missing keys fall back to English automatically.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│              React + Vite Frontend                  │
│         Firebase Hosting — pulse-11de7.web.app      │
│  Google Maps · Firebase Auth · i18next · onSnapshot │
│  Vapi Web SDK (browser voice agent)                 │
└──────────────────┬──────────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────────┐
│           Node.js + Express Backend                 │
│                 Render                              │
│  Twilio · Firebase Admin · Gemini Vision · Cron    │
│  Vapi Webhook (/vapi-webhook)                       │
└──────────┬───────────────────────┬──────────────────┘
           │ REST API              │ Read/Write
┌──────────▼──────────┐   ┌───────▼────────────────────┐
│  Python Flask AI    │   │    Firebase Firestore       │
│       Render        │   │                            │
│  Groq · Gemini      │   │  /reports  /volunteers     │
│  Nominatim          │   │  /clusters  /tasks         │
│  Haversine          │   │  /ngos  /conversations     │
└─────────────────────┘   │  /predictive_alerts        │
                          └────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Why we chose it |
|---|---|---|
| React + Vite | UI framework | Component model and fast builds |
| Tailwind CSS + Framer Motion | Styling + animations | Quick, consistent UI and smooth transitions |
| **Firebase Hosting** | Production deployment | CDN-distributed, automatic SSL, global edge delivery |
| **Firebase Firestore (onSnapshot)** | Real-time data sync | Zero polling: crisis data reaches the dashboard in under 1 second |
| **Firebase Auth** | NGO authentication | Stateless auth, no separate user database needed |
| **Google Maps API** | Live cluster map | Urgency-colored markers, exact GPS directions link per dispatch |
| Vapi Web SDK | Browser voice agent | Speech reporting without building voice infrastructure |
| i18next + react-i18next | 7-language frontend | Instant language switching with English fallback |
| react-router-dom | Page routing | Client-side routing and protected routes |

### Backend
| Technology | Purpose | Why we chose it |
|---|---|---|
| Node.js + Express.js | REST API server (22+ routes) | Event-driven, well suited to webhooks |
| Twilio | WhatsApp + SMS + IVR voice | Three channels through one API |
| **Gemini Vision API** | Proof photo verification | Multimodal: checks task match and fraud in one API call |
| Firebase Admin SDK | Firestore + Auth operations | Trusted server-side access with token verification |
| Vapi | Browser voice agent + inbound phone AI assistant | Natural voice conversations without custom speech stack |
| node-cron | Hourly escalation scheduler | Simple scheduling inside the existing server |
| Render | Production deployment | Easy hosting for Node and Flask services |

### AI Microservice
| Technology | Purpose | Why we chose it |
|---|---|---|
| Python 3.x + Flask | AI API server | Lightweight, and Python is the natural home for AI code |
| Groq (llama-3.3-70b-versatile) | Crisis analysis + report generation | Fast, low-cost open-model inference |
| **Gemini 2.5 Flash** | Auto-fallback AI | Multimodal: handles text analysis and Vision when Groq is unavailable |
| OpenStreetMap Nominatim | Free geocoding | Free, no API key, full India coverage |
| Haversine formula | Geographic clustering (30km radius) | Simple, accurate distance math with no external dependency |
| Render | Production deployment | Easy hosting alongside the backend |
 
### Database
| Collection | Purpose |
|---|---|
| `/reports` | All field reports — WhatsApp, SMS, IVR, Vapi, bot, manual |
| `/volunteers` | Registered volunteers with skills, location, availability |
| `/clusters` | Grouped crisis clusters with urgency and centroid |
| `/tasks` | Volunteer assignments and lifecycle tracking |
| `/ngos` | Registered NGO organizations |
| `/conversations` | Active WhatsApp bot sessions (auto-expire 30 min) |
| `/predictive_alerts` | AI-generated upcoming crisis warnings |

---

## 📡 API Reference

### Backend (Node.js)

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/incoming-message` | WhatsApp webhook — handles direct reports, bot flow, and volunteer replies |
| POST | `/incoming-call` | IVR voice call handler (TwiML) |
| POST | `/handle-language` | IVR language selection processor |
| POST | `/handle-keypress` | IVR menu keypress processor |
| POST | `/handle-recording` | Saves IVR voice recording to Firestore |
| POST | `/vapi-webhook` | Receives Vapi end-of-call transcript, saves voice report to Firestore and triggers AI analysis |
| POST | `/register-volunteer` | Registers new volunteer with geocoding |
| POST | `/match-volunteers` | Returns top 3 matched volunteers for a cluster |
| POST | `/assign-volunteer` | Assigns volunteer to cluster, creates task, sends notification |
| POST | `/update-task` | Updates task status (accept / done) |
| POST | `/sms-reply` | Handles ACCEPT / DONE SMS replies |
| POST | `/register-ngo` | NGO registration with Firebase Auth |
| POST | `/login-ngo` | NGO login — returns custom auth token |
| POST | `/reassign` | Reassigns cluster to a different volunteer |
| POST | `/force-assign` | Force-assigns for high-urgency override |
| POST | `/resolve-cluster` | Marks cluster resolved with note, frees volunteer |
| POST | `/chat` | AI chatbot — intent detection + LLM fallback |
| GET | `/analytics` | Full live system statistics |
| POST | `/generate-report` | Generates AI impact report for a cluster |
| POST | `/demo-trigger` | Fires demo crisis reports for presentation |
| DELETE | `/clear-demo-data` | Removes all demo reports and clusters |
| GET | `/predictive-alerts` | Returns all active predictive alerts |

### AI Microservice (Flask)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/analyze` | Raw text → structured crisis data + coordinates |
| POST | `/cluster` | Array of reports → grouped clusters |
| POST | `/match` | Cluster + volunteers → ranked matches |
| POST | `/escalate` | Recalculates urgency scores over time |
| POST | `/generate-report` | Cluster data → 3-paragraph NGO report |
| POST | `/pre-alert` | Region + pattern → predictive warning |
| POST | `/verify-proof` | Volunteer image → Gemini Vision verification result |

---

## 📁 Project Structure

```
PULSE/
├── backend/                  ← Node.js + Express server
│   ├── index.js              ← Main server + all 22+ API routes
│   ├── package.json
│   └── .env                  ← Secret keys (not on GitHub)
│
├── ai/                       ← Python AI microservice
│   ├── app.py                ← Flask server
│   ├── intelligence.py       ← Crisis analysis + urgency scoring
│   ├── clustering.py         ← Haversine-based cluster grouping
│   ├── matching.py           ← Volunteer skill + distance matching
│   ├── report_generator.py   ← NGO impact report generation
│   ├── config.py             ← All thresholds and settings
│   ├── seed_data.py          ← Demo reports + volunteers
│   └── requirements.txt
│
└── frontend/                 ← React + Vite dashboard
    └── src/
        ├── components/       ← Navbar, VoiceAgent, LanguageSwitcher, ProtectedRoute
        └── pages/            ← 10 pages: Landing, Login, Dashboard, Reports,
                                 Tasks, Volunteers, Analytics, Intake,
                                 VolunteerRegistration, VolunteerPortal
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Firebase project with Firestore enabled
- Twilio account (WhatsApp sandbox + real number)
- Groq API key (free at console.groq.com)
- Gemini API key (free at aistudio.google.com)
- Google Maps API key (free tier at console.cloud.google.com)
- Vapi account with assistant configured (vapi.ai)

### Run the AI Microservice
```bash
cd ai
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
# Create .env with GROQ_API_KEY and GEMINI_API_KEY
python app.py
# Runs at http://localhost:5000
```

### Run the Backend
```bash
cd backend
npm install
# Create .env with Firebase + Twilio + Vapi credentials
node index.js
# Runs at http://localhost:3000
```

### Run the Frontend
```bash
cd frontend
npm install
# Create .env with VITE_GOOGLE_MAPS_API_KEY, VITE_VAPI_PUBLIC_KEY, VITE_VAPI_ASSISTANT_ID
npm run dev
# Opens at http://localhost:5173
```

### Environment Variables

**Backend `.env`**
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_REAL_NUMBER=
FIREBASE_KEY=
MY_PHONE_NUMBER=
PUBLIC_BASE_URL=
NGO_ADMIN_PHONE=
```

**Frontend `.env`**
```
VITE_GOOGLE_MAPS_API_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_VAPI_PUBLIC_KEY=
VITE_VAPI_ASSISTANT_ID=
```

---

## 🌱 Demo Data

```bash
cd ai
python seed_data.py seed    # Load demo reports + volunteers
python seed_data.py clear   # Remove all seeded data
python seed_data.py reset   # Clear and reload fresh
```

Or from the live dashboard — click **"Fire Demo"** to instantly populate the map.

---

## 🌍 Real-World Impact

PULSE is built for a real, underserved problem. NGOs in India — particularly those working in rural Telangana, Andhra Pradesh, and similar regions — have no affordable, multilingual, automated coordination tool. They rely on WhatsApp group chats, phone trees, and spreadsheets.

PULSE changes this by making it possible for:
- A field worker with a basic phone to report a water crisis in Telugu in under 10 seconds
- An NGO admin to see that crisis on a live map, scored by AI, in under 30 seconds
- A nearby volunteer to be automatically assigned, notified, and navigating to the location in under 60 seconds

At scale, this means faster response times, smarter resource allocation, less duplication of effort, and — most importantly — fewer people waiting in crisis.

---
## 💼 Business Model

**Who it's for:** NGO coordinators, volunteers and field workers. The paying customers are small and mid-size NGOs and relief groups running field programs in water, food and health, plus the CSR teams and grant-makers who fund them.

| Tier | Price | What's included |
|---|---|---|
| **Free** | ₹0 | 1 NGO, up to 50 reports/month, web dashboard. Drives adoption. |
| **Pro** | ₹2,999 per NGO per month | All intake channels, auto-dispatch, photo verification, impact reports |
| **Usage pass-through** | At cost + small margin | Twilio WhatsApp, SMS and IVR charges |
| **Funder** | ₹25,000 per year | Verified impact dashboards for CSR teams and grant-makers, built from proof photos and completion data |

**Unit economics:** each report costs roughly one LLM call, one geocode and a few messages, so costs scale with usage rather than with headcount.

**Go-to-market:** pilot with NGOs in Hyderabad and Telangana, then expand through NGO networks and CSR partners.

---

## 📈 Scalability

- **Independent services:** the AI service, backend and frontend are deployed separately, so each scales and fails on its own.
- **Multi-tenant by design:** every record is tagged with `ngo_id`, so adding an NGO means adding a tenant, not a deployment.
- **AI redundancy:** automatic fallback from Groq LLaMA 3.3 to Gemini 2.5 Flash keeps analysis running during a provider outage.
- **Real-time without polling:** Firestore `onSnapshot` keeps dashboards live as data grows.
- **First bottleneck:** geocoding. The public OpenStreetMap Nominatim service is rate-limited, so at scale we move to a self-hosted instance or the Google Geocoding API.
- **Planned:** Vertex AI geospatial clustering in place of Haversine, and the escalation cron moved to Google Cloud Functions.

---
## 🗺️ Roadmap

**Now — live and deployed**
- 5-channel multilingual intake (WhatsApp, SMS, IVR, Vapi browser, Vapi phone)
- AI crisis analysis, clustering, volunteer matching, proof verification
- Predictive alerts, real-time dashboard, multi-NGO isolation

**Next (0–3 months)**
- Offline-first mobile app — reports queue locally, sync when internet returns
- SMS-only mode for 2G feature phones
- Volunteer reputation scoring based on response time and proof quality
- Migrate escalation cron to Google Cloud Functions

**Medium term (3–12 months)**
- Expand from 3 crisis types to 10+ including shelter, sanitation, elderly care
- Vertex AI to replace Haversine clustering with geospatial ML
- State government API integration for district disaster management systems
- Cross-NGO resource sharing — surplus volunteers routed across organizations

**Long term**
- Open-source release for global NGO self-hosting across South Asia and Sub-Saharan Africa
- Looker Studio dashboards for government and donor impact reporting
- Google.org partnership for institutional scaling
- What UPI did for payments — PULSE for community crisis response

---

## 👥 Team & Contributions

| Role | Contributor | Responsibilities |
|---|---|---|
| **AI/ML Lead** | [Umaima](https://github.com/umaima06) | Flask AI microservice, Groq + Gemini integration, crisis analysis pipeline, clustering, volunteer matching, report generation, proof verification, predictive alerts, seed data |
| **Backend Lead** | [Zunairah](https://github.com/Zunairah-k) | Node.js + Express server, Twilio WhatsApp + SMS + IVR, Vapi webhook integration, Firebase Auth + Firestore, volunteer coordination system, chatbot, cluster action API, urgency escalation cron, NGO admin controls, multi-NGO isolation, multilingual i18n frontend |
| **Frontend Lead** | [Alizah](https://github.com/alizahh-7) | React + Vite dashboard, Google Maps integration, all 10 pages, UI design system, Firebase Hosting deployment, real-time Firestore integration, volunteer portal, analytics, demo trigger, live volunteer SVG map |

---

## 📜 Development Journey

PULSE is built by a 3-person team during the GDG Solution Challenge sprint. Each teammate maintained detailed development logs tracking every route, feature, bug fix, and system decision from day 1 through deployment.

👉 [View Full Development Logs](./docs/development-journey.md)

---

## 📄 License

This project was built for the Google Developer Groups Solution Challenge 2026 under the domain: **Smart Resource Allocation — Data-Driven Volunteer Coordination for Social Impact.**

**UN SDG Targets addressed: SDG 11.5 · SDG 1.5 · SDG 3.8**

---

*Built with purpose. Deployed with care. Designed for the people who need it most.*
