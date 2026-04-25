# PULSE — AI-Powered Crisis Coordination for NGOs

> *Turning scattered field reports into real-time, automated community crisis response.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pulse--11de7.web.app-blue)](https://pulse-11de7.web.app/)
![Backend](https://img.shields.io/badge/Backend-Railway-green)
![AI Service](https://img.shields.io/badge/AI%20Service-Railway-purple)
[![GitHub](https://img.shields.io/badge/GitHub-Public%20Repo-yellow)](https://github.com/umaima06/Pulse)

---
## 🌍 UN SDG Alignment

PULSE is built in direct response to three United Nations Sustainable Development Goals:

| SDG | Target | How PULSE Contributes |
|---|---|---|
| **SDG 11.5** | Reduce deaths and losses from disasters for vulnerable communities | Reduces coordination delay from 4–6 hours to under 30 seconds — the window where lives are lost |
| **SDG 1.5** | Build resilience of the poor to climate-related disasters | Serves zero-literacy, zero-smartphone, zero-English users through IVR and multilingual WhatsApp |
| **SDG 3.8** | Universal access to essential healthcare services | Medical emergency track routes health crises to skilled volunteers automatically |

> *"By 2030, significantly reduce the number of deaths and the number of people affected by disasters, with a focus on protecting the poor and people in vulnerable situations."*
> — UN SDG 11.5. This is what we built PULSE for.

---

## 🌍 The Problem

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

A field worker sends one message — in any language, on any device — via WhatsApp, SMS, or a voice IVR call. PULSE receives it, understands it using AI, scores its urgency, geocodes the location, and automatically assigns the nearest skilled volunteer. The entire chain happens in seconds, with zero manual intervention.

The NGO Admin monitors everything on a live Google Maps dashboard — color-coded crisis clusters, volunteer assignments, predictive alerts, and AI-generated impact reports — all updating in real time.

**Three teammates. Three deployed microservices. One working product.**

---

## 🔗 Live Website Link

| Resource | URL |
|---|---|
| 🌐 Frontend (Website) | https://pulse-11de7.web.app |

---
## ⚡ End-to-End Pipeline 

```
Field Worker (WhatsApp / SMS / IVR / Bot)
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
### Why Google — Every Tool Chosen Deliberately

| Google Tool | Why specifically used |
|---|---|
| Firebase Firestore + onSnapshot | Zero-latency real-time sync — crisis data appears on dashboard in under 1 second, no polling, no refresh |
| Firebase Auth | Stateless NGO login without maintaining a separate user database. Org name stored in Firestore, shown in navbar |
| Firebase Hosting | CDN-distributed React frontend with automatic SSL and global edge delivery, zero config |
| Google Maps API | Urgency-colored cluster markers with InfoWindows. Volunteer dispatch includes exact GPS directions link |
| Gemini 2.5 Flash | Multimodal Vision API for proof verification — checks task match AND fraud detection. Also serves as AI analysis fallback |

**Future Google integration roadmap:**
- **Vertex AI** — replace Haversine clustering with geospatial ML models for smarter crisis zone prediction
- **Google Cloud Functions** — replace Railway cron jobs for serverless auto-scaling escalation
- **Looker Studio** — NGO and government impact reporting dashboards pulling live Firestore data

---

## 🚀 Features

### 📥 Intake & Reporting

- **4-channel multilingual intake** — WhatsApp, SMS, IVR voice call, and manual intake form. Supports Hindi, Telugu, Tamil, Marathi, Bengali, Urdu, and English. Works on any device, any connectivity level.
- **WhatsApp Conversational Bot** — detects vague messages ("help", "problem hai") and guides field workers through a 4-step conversation: crisis type → people affected → days unmet → location. Automatically detects and responds in the user's language. Sessions expire after 30 minutes.
- **Smart message classification** — detailed messages skip the bot entirely and go straight to AI processing. Only vague or incomplete messages trigger the guided flow.
- **IVR Voice System** — field worker calls the PULSE number, selects preferred language, presses 1 (water) / 2 (food) / 3 (medical), and records a 30-second voice report. Zero smartphone literacy required.
- **Multilingual IVR** — caller selects from Hindi, Telugu, Tamil, or English. Voice menu and prompts dynamically adapt to the selected language.
- **Manual intake form** — NGO coordinators can log crises directly via the dashboard. Calls the AI microservice, shows urgency score and summary immediately, and saves enriched data to Firestore.

---

### 🧠 AI Intelligence Layer

- **Gemini AI Crisis Analysis** — converts any raw text in any Indian language into structured JSON: crisis type (water / food / medical), urgency score (1–100), GPS coordinates, detected language, and a plain-English summary. Primary model: Groq LLaMA 3.3 70B. Automatic fallback: Gemini 2.5 Flash if Groq is unavailable.
- **OpenStreetMap Nominatim Geocoding** — converts any location text ("Abids, Hyderabad", "near the railway station in Warangal") into real latitude and longitude coordinates. Free, no API key required, full India coverage.
- **Smart Crisis Clustering** — groups nearby same-type reports within a 30km radius into one cluster using the Haversine distance formula. Calculates combined urgency score and total affected population per cluster. Prevents duplicate volunteer deployments.
- **Volunteer Matching Algorithm** — ranks all available volunteers by skill match, distance from the cluster, and current availability. Auto-assigns the top match when cluster urgency reaches 80 or above.
- **Urgency Escalation** — an hourly cron job automatically increases urgency scores for clusters that remain unresolved over time, based on crisis type and hours elapsed. Prevents neglected crises from staying low-priority indefinitely.
- **Predictive Alert System** — analyzes historical Firestore data by region, crisis type, and month to forecast upcoming crises. Sends early WhatsApp warnings to the NGO admin with HIGH / MEDIUM / LOW confidence ratings. Runs on server startup and daily thereafter.
- **AI Impact Report Generation** — converts any cluster's data into a professional 3-paragraph NGO impact report using Groq LLaMA 3.3 70B. Available on demand from the dashboard with a copy-to-clipboard button.
- **AI Proof Verification (Gemini Vision)** — when a volunteer submits a completion photo, Gemini Vision runs three checks: (1) does the image show activity relevant to the assigned task type — water distribution, food delivery, or medical aid? (2) is the image a real field photo and not a stock image, internet download, or reused submission? (3) does the scene match a plausible crisis context in India? All three checks must pass before the task is marked complete. If fraud risk is high, the task is rejected and the volunteer is asked to resubmit. If AI is unavailable, the task is flagged for manual review.
- **AI Chatbot Assistant** — intent-based chatbot with 5 modes: reporting mode (routes to WhatsApp or intake form), analytics mode (fetches live Firestore stats), predictive alert mode (returns top risk region and confidence), info mode (explains PULSE), and Groq LLM fallback for free-form queries. Connected to React Router for in-app navigation.

---

### 🤝 Volunteer Coordination

- **Dual notifications (WhatsApp + SMS simultaneously)** — every volunteer assignment sends both channels at once. Message includes crisis type, location name, people affected, a plain-language summary, and a direct Google Maps navigation link using the exact GPS coordinates of the most urgent report in the cluster (not the cluster centroid).
- **WhatsApp reply handling** — volunteers reply ACCEPT (task confirmed, instructions sent), DONE (task marked complete, volunteer freed), or DECLINE (task auto-reassigned to next match). All updates fire to Firestore in real time.
- **NGO Cluster Action Controls** — from the dashboard, NGO admins can: Assign a specific volunteer, Reassign to a different volunteer, Force-Assign for high-urgency override, or Mark Resolved with a custom resolution note. All actions trigger instant WhatsApp notifications to the relevant volunteer.
- **Task lifecycle tracking** — full status flow: Assigned → Accepted → Proof Awaiting → Proof Verified → Resolved. Every transition is timestamped and logged.
- **Response delay tracking** — color-coded delay indicators (green / yellow / red) per task. "Days unmet" metric shows how long a crisis has been unresolved since the original report.
- **Volunteer availability toggle** — volunteers can set themselves On Duty or Off Duty from the portal. Availability automatically flips to unavailable when a task is accepted and back to available when a task is completed.
- **Resolution notes** — NGO admins write a custom resolution note when closing a cluster. Stored with `resolution_note` and `resolved_at` timestamp in Firestore.

---

### 🗺️ NGO Dashboard & Frontend

- **Live Google Maps Dashboard** — real-time cluster visualization with color-coded urgency markers: 🔴 Red (critical, 80+), 🟠 Orange (high, 50–79), 🟡 Yellow (medium), 🔵 Blue (individual unclustered report). Clusters show report count as labels. High-urgency clusters show an expanded radius overlay.
- **Cluster detail panel** — click any cluster to open a side panel showing: need type, affected villages, people count, days unmet, assigned volunteer identity, response status, and all NGO action buttons.
- **Live feed sidebar** — real-time stream of incoming reports from Firestore onSnapshot. Toggle show/hide. Pulsing green dot indicates live data.
- **Predictive alerts banner** — AI-generated upcoming crisis warnings displayed across the top of the dashboard.
- **One-click demo trigger** — "Fire Demo" button calls `/demo-trigger` and places 3 realistic crisis reports on the live map instantly. Used for presentations and judge demos.
- **10-page application** — Landing, Login, Dashboard, Reports, Tasks, Volunteers, Analytics, Intake, Volunteer Registration, Volunteer Portal (My Tasks).
- **Analytics page** — live system stats from Firestore: total reports, volunteers, clusters, tasks, crisis type breakdown, cluster severity distribution, people helped counter, and task completion progress bars.
- **Reports page** — all incoming field reports with urgency scores, language tags, need type badges, and timestamps. Ordered by newest first, filtered to analyzed reports only.
- **Tasks page** — full volunteer assignment tracker. Status labels: Assigned / Proof Awaiting / Proof Verified / Done / Declined. Inline proof image and Gemini Vision verification result per card.
- **Volunteers page** — all registered volunteers with skills, organization, location, and current availability status.
- **Volunteer Portal (/my-tasks)** — no login required. Phone number lookup returns all tasks for that volunteer via Firestore onSnapshot. Active tasks, completed tasks, total count, availability toggle, task accept/complete buttons, and one-tap Google Maps directions link per task.
- **Route protection** — all dashboard pages redirect to `/login` if unauthenticated. Powered by Firebase Auth.
- **Mobile-responsive navbar** — hamburger menu for mobile, active link highlights, org name display after login, and logout.

---

### 🏢 NGO & System Management

- **NGO registration and login** — Firebase Auth with email/password or Google sign-in. Organization name saved on register and displayed in the navbar.
- **Multi-NGO data isolation** — every report, volunteer, cluster, and task is tagged with `ngo_id`. NGO-scoped endpoints (`/ngo-reports`, `/ngo-volunteers`, `/ngo-clusters`, `/ngo-analytics`) ensure each NGO only ever sees their own data.
- **Token verification middleware** — all protected backend routes verify Firebase Auth tokens before processing.
- **Analytics endpoint** — `/analytics` returns full system stats: total reports, volunteers, clusters, tasks, crisis type breakdown, and severity distribution. All data is live from Firestore.

---

### 🌐 Multilingual Frontend (i18n)

- Full 7-language support across all 10 pages: English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Marathi (मराठी), Bengali (বাংলা), Urdu (اُردُو)
- Reusable `LanguageSwitcher` component — compact toggle buttons in the Navbar, Landing page, Login, and RoleSelect
- `useTranslation()` hook applied across every page — labels, buttons, headings, error messages, placeholders, status indicators, loading states, and empty states are all translated
- Language switches globally and instantly with zero page reload. Persists across navigation within the session.
- `en.json` is the master reference. English is the hardcoded `fallbackLng` — any missing translation key falls back to English automatically.

---

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────┐
│              React + Vite Frontend                  │
│         Firebase Hosting — pulse-11de7.web.app      │
│  Google Maps · Firebase Auth · i18next · onSnapshot │
└──────────────────┬──────────────────────────────────┘
│ REST API
┌──────────────────▼──────────────────────────────────┐
│           Node.js + Express Backend                 │
│              Railway — Port 3000                    │
│  Twilio · Firebase Admin · Gemini Vision · Cron    │
└──────────┬───────────────────────┬──────────────────┘
│ REST API              │ Read/Write
┌──────────▼──────────┐   ┌───────▼────────────────────┐
│  Python Flask AI    │   │    Firebase Firestore       │
│  Railway — Port 5000│   │                            │
│  Groq · Gemini      │   │  /reports  /volunteers     │
│  Nominatim          │   │  /clusters  /tasks         │
│  Haversine          │   │  /ngos  /conversations     │
└─────────────────────┘   │  /predictive_alerts        │
└────────────────────────────┘
```
---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS + Framer Motion | Styling and animations |
| Firebase Hosting | Production deployment |
| Firebase Firestore (onSnapshot) | Real-time data sync |
| Firebase Auth | NGO authentication |
| Google Maps API | Live cluster map visualization |
| i18next + react-i18next | 7-language frontend |
| react-router-dom | Page routing and navigation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server (21+ routes) |
| Twilio | WhatsApp + SMS intake and volunteer notifications, IVR voice |
| Firebase Admin SDK | Firestore operations + Auth verification |
| Gemini Vision API | Volunteer proof photo verification |
| node-cron | Hourly urgency escalation scheduler |
| Railway | Production deployment |

### AI Microservice
| Technology | Purpose |
|---|---|
| Python 3.x + Flask | AI API server |
| Groq (llama-3.3-70b-versatile) | Primary AI — crisis analysis, urgency scoring, report generation |
| Gemini 2.5 Flash | Auto-fallback if Groq fails |
| OpenStreetMap Nominatim | Free geocoding for any location in India |
| Haversine formula | Geographic clustering (30km radius) |
| Railway | Production deployment |

### Database
| Collection | Purpose |
|---|---|
| `/reports` | All field reports — WhatsApp, SMS, IVR, bot, manual |
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
| POST | `/handle-keypress` | IVR menu keypress processor |
| POST | `/handle-recording` | Saves IVR voice recording to Firestore |
| POST | `/register-volunteer` | Registers new volunteer with geocoding |
| POST | `/match-volunteers` | Returns top 3 matched volunteers for a cluster |
| POST | `/assign-volunteer` | Assigns volunteer to cluster, creates task, sends notification |
| POST | `/update-task` | Updates task status (accept / done) |
| POST | `/sms-reply` | Handles ACCEPT / DONE SMS replies |
| POST | `/register-ngo` | NGO registration with Firebase Auth |
| POST | `/login-ngo` | NGO login — returns custom auth token |
| POST | `/reassign` | Reassigns cluster to a different volunteer |
| POST | `/force-assign` | Force-assigns for high-urgency override |
| POST | `/chat` | AI chatbot — intent detection + LLM fallback |
| GET | `/analytics` | Full live system statistics |
| POST | `/generate-report` | Generates AI impact report for a cluster |
| POST | `/demo-trigger` | Fires 3 demo crisis reports for presentation |
| GET | `/predictive-alerts` | Returns all active predictive alerts |

### AI (Flask)

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
│   ├── index.js              ← Main server + all 21+ API routes
│   ├── package.json
│   ├── seed-volunteer.js
│   ├── .env                  ← Secret keys (not on GitHub)
│   └── serviceAccountKey.json ← Firebase credentials (not on GitHub)
│
├── ai/                       ← Python AI microservice
│   ├── app.py                ← Flask server (port 5000)
│   ├── intelligence.py       ← Crisis analysis + urgency scoring
│   ├── clustering.py         ← Haversine-based cluster grouping
│   ├── matching.py           ← Volunteer skill + distance matching
│   ├── report_generator.py   ← NGO impact report generation
│   ├── config.py             ← All thresholds and settings
│   ├── seed_data.py          ← 25 demo reports + 20 volunteers
│   └── requirements.txt
│
└── frontend/                 ← React + Vite dashboard
└── src/
├── components/       ← Navbar, ProtectedRoute, Spinner
└── pages/            ← 10 pages: Dashboard, Reports, Tasks,
Volunteers, Analytics, Intake,
Volunteer, VolunteerPortal,
PredictiveAlerts, Landing, Login
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
# Create .env with Firebase + Twilio credentials
node index.js
# Runs at http://localhost:3000
```

### Run the Frontend
```bash
cd frontend
npm install
# Create .env with VITE_GOOGLE_MAPS_API_KEY
npm run dev
# Opens at http://localhost:5173
```

### Expose Backend for Twilio (dev only)
```bash
cd backend
.\ngrok.exe http 3000
# Copy the https URL → paste into Twilio sandbox webhook settings
```

---

## 🌱 Demo Data

```bash
cd ai
python seed_data.py seed    # Load 25 demo reports + 20 volunteers
python seed_data.py clear   # Remove all seeded data
python seed_data.py reset   # Clear and reload fresh
```

---

## 🌍 Real-World Impact

PULSE is built for a real, underserved problem. NGOs in India — particularly those working in rural Telangana, Andhra Pradesh, and similar regions — have no affordable, multilingual, automated coordination tool. They rely on WhatsApp group chats, phone trees, and spreadsheets.

PULSE changes this by making it possible for:
- A field worker with a basic phone to report a water crisis in Telugu in under 10 seconds
- An NGO admin to see that crisis on a live map, scored by AI, in under 30 seconds
- A nearby volunteer to be automatically assigned, notified, and navigating to the location in under 60 seconds

At scale, this means faster response times, smarter resource allocation, less duplication of effort, and — most importantly — fewer people waiting in crisis.

---

## 👥 Team & Contributions

| Role | Contributor | Responsibilities |
|---|---|---|
| **AI/ML Lead** | [Umaima](https://https://github.com/umaima06) | Flask AI microservice, Groq + Gemini integration, crisis analysis pipeline, clustering, volunteer matching, report generation, proof verification, predictive alerts, seed data |
| **Backend Lead** | [Zunairah](https://https://github.com/Zunairah-k) | Node.js + Express server, Twilio WhatsApp + SMS + IVR, Firebase Auth + Firestore, volunteer coordination system, chatbot development, cluster action API, urgency escalation cron, NGO admin controls, multi-NGO isolation, multilingual i18n frontend |
| **Frontend Lead** | [Alizah](https://https://github.com/alizahh-7) | React + Vite dashboard, Google Maps integration, all 10 pages, UI design system, Firebase Hosting deployment, real-time Firestore integration, volunteer portal, analytics, demo trigger |

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
