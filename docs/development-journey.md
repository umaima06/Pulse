# Pulse
PULSE is an AI-powered decision system for NGOs that collects scattered community data, identifies the most urgent needs, and helps allocate volunteers and resources smartly — even without internet access.

# Project Structure
```
PULSE/
│
├── backend/                       ← Person B (Zunairah) — Node.js server
│   ├── index.js                   ← Main Express server + all API routes
│   ├── package.json               ← Node dependencies
│   ├── package-lock.json
│   ├── ngrok.exe                  ← Exposes local server to internet
│   ├── .env                       ← Secret keys (not on GitHub)
│   ├── .gitignore
│   └── serviceAccountKey.json     ← Firebase credentials (not on GitHub)
│   └── seed-volunteer.js
│
├── ai/                            ← Person A — Python AI brain
│   ├── app.py                     ← Flask server running on port 5000
│   ├── intelligence.py            ← Groq AI analysis + urgency scoring
│   ├── clustering.py              ← Groups nearby reports into clusters
│   ├── matching.py                ← Volunteer skill + distance matching
│   ├── config.py                  ← AI configuration
│   ├── report_generator.py
│   ├── requirements.txt           ← Python dependencies
│   ├── seed_data.py
│   ├── TECHNICAL_DOCS.md
│   └── .env                       ← Groq API key (not on GitHub)
│
├── frontend/                      ← Person C — React dashboard
│   └── src/
│   │   └──components/
│   │   │  └── Navbar.jsx
│   │   │  └── ProtectedRoute.jsx
│   │   │  └── Spinner.jsx
│   │   └──pages/
│   │   │  └── Analytics.jsx
│   │   │  └── Dashboard.jsx
│   │   │  └── Intake.jsx
│   │   │  └── Landing.jsx
│   │   │  └── Login.jsx
│   │   │  └── notfound.jsx
│   │   │  └── PredictiveAlerts.jsx
│   │   │  └── Reports.jsx
│   │   │  └── RoleSelect.jsx
│   │   │  └── Spinner.jsx
│   │   │  └── Tasks.jsx
│   │   │  └── Volunteer.jsx
│   │   │  └── VolunteerPortal.jsx
│   │   │  └── Volunteers.jsx
│   │   └──App.css 
│   │   └──App.jsx
│   │   └──firebase.js 
│   │   └──index.css 
│   │   └──main.jsx
│   └──.env
│   └──.gitignore
│
└── .gitignore
└── package-lock.json
└── package.json
└── README.md
```
# Umaima
# PULSE — AI Layer

## Overview
The AI layer is the core intelligence system of *PULSE*. It transforms unstructured, real-world inputs (WhatsApp messages, SMS, voice transcripts, manual reports) into structured, actionable crisis data for NGOs.

This system automates:
- Crisis understanding  
- Urgency scoring  
- Location extraction  
- Report clustering  
- Volunteer matching  
- Predictive alerts  
- Proof verification  

It eliminates manual coordination and enables real-time, data-driven disaster response.

---

## What It Does

| Step | Action |
|------|--------|
| 1 | Reads any field report in Hindi, Telugu, Tamil, English, or mixed language |
| 2 | Identifies the crisis type — water, food, or medical |
| 3 | Calculates an urgency score from 1 to 100 |
| 4 | Geocodes the exact location anywhere in India |
| 5 | Groups nearby same-type reports into crisis clusters |
| 6 | Matches the best available volunteer by skill and distance |
| 7 | Generates professional NGO impact reports |
| 8 | Verifies volunteer proof photos using Gemini Vision |

---
## ⚙️ Architecture

```
Input Sources (WhatsApp / SMS / IVR / Form) ↓ AI Layer (Flask API) ↓ Structured Crisis Intelligence ↓ Backend (Node.js) → Firestore → Frontend Dashboard
```
---
## 🚀 Core Capabilities

### 1. 🧾 Intelligent Report Processing (/analyze)
- Accepts raw text in any language (Hindi, Telugu, Tamil, English, mixed)
- Uses LLMs to extract:
  - Crisis type (water / food / medical)
  - Urgency score (0–100)
  - Affected population
  - Location (converted to coordinates)
  - Clean summary  

✅ Works even with messy, incomplete, or informal inputs  

---

### 2. 📍 Geolocation (OpenStreetMap - Nominatim)
- Converts location text → real latitude & longitude  
- Works across India without API cost  
- Enables map visualization + clustering  

---

### 3. 🔗 Crisis Clustering (/cluster)
- Groups nearby reports of the same type  
- Uses Haversine distance formula (~30km radius)  

*Outputs:*
- Cluster centroid  
- Combined urgency  
- Alert level (LOW / MEDIUM / HIGH)  

✅ Prevents duplicate efforts  
✅ Identifies real crisis zones  

---

### 4. 🤝 Volunteer Matching (/match)
Ranks volunteers using:
- Skill match  
- Distance from crisis  
- Availability  

*Outputs:*
- Ranked volunteer list  
- Match scores  
- Distance (km)  

✅ Ensures fastest and most relevant response  

---

### 5. ⏱️ Urgency Escalation (/escalate)
- Automatically increases urgency over time if unresolved  

*Factors:*
- Hours since report  
- Crisis type  

✅ Prevents neglected crises  

---

### 6. 📊 AI Report Generation (/generate-report)
- Converts cluster data into professional NGO reports  

*Useful for:*
- Decision making  
- Documentation  
- Impact reporting  

---

### 7. ⚠️ Predictive Alerts (/pre-alert) (yet to work)
- Detects patterns in historical data  
- Generates early warnings for future crises  

*Example:*
> “High probability of water shortage in Region X based on past trends.”

---

### 8. 💬 Conversational AI Assistant (/ask-ai)
- Powered by LLM (Groq - LLaMA 3.3)  

Answers:
- System-related queries  
- NGO workflow questions  
- General user queries  

---

### 9. 🖼️ AI Proof Verification (Gemini Vision) (/verify-proof)
Validates volunteer-submitted images  

*Checks:*
- Content matches task  
- Real field photo vs stock image  
- Context plausibility  

*Outputs:*
- Verification status  
- Confidence score  
- Fraud risk level  

✅ Prevents fake task completion  
✅ Ensures accountability  

When a volunteer marks a task as done, PULSE does not simply accept their word. The volunteer is asked to submit a photo as proof. The image is sent to Gemini Vision, which runs three checks:

1. **Content match** — Does the image show activity relevant to the task type, such as water distribution, food delivery, or medical aid?
2. **Authenticity** — Does this look like a real field photo taken on a phone camera, or a stock image downloaded from the internet?
3. **Context plausibility** — Does the setting match a genuine crisis scenario in India?

All three checks must pass for the task to be marked as verified. If the fraud risk is high, the task is rejected and the volunteer is asked to resubmit. If the AI is unavailable, the task is flagged for manual review by the NGO coordinator.

---
## Tech Stack

| Tool | Purpose |
|------|---------|
| Python 3.x | Core language |
| Groq — llama-3.3-70b-versatile | Primary AI model for analysis and report writing |
| Gemini 2.5 Flash | Automatic fallback if Groq fails + image verification |
| OpenStreetMap Nominatim | Free geocoding for any location in India |
| Flask | API server running on port 5000 |
| Firebase Firestore | Database |

---

## AI Pipeline Modules

| File | What it does |
|------|-------------|
| `intelligence.py` | Core analysis — reads any report, extracts need type, urgency score, location, and coordinates |
| `clustering.py` | Groups nearby same-type reports into crisis clusters using Haversine distance within 30km radius |
| `matching.py` | Ranks available volunteers by skill match, distance, and availability |
| `report_generator.py` | Generates 3-paragraph NGO impact reports and 2-sentence predictive pre-alerts |
| `config.py` | All settings in one place — crisis types, urgency rules, skill matrix, thresholds |
| `app.py` | Flask server exposing all AI functions as HTTP endpoints |
| `seed_data.py` | Seeds 25 demo crisis reports and 20 volunteer profiles into Firestore |

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/health` | Check server is running |
| POST | `/analyze` | Any text → structured crisis data + real coordinates |
| POST | `/cluster` | Array of reports → grouped crisis clusters |
| POST | `/match` | Cluster + volunteers → ranked volunteer matches |
| POST | `/escalate` | Recalculates urgency scores for unresolved reports |
| POST | `/generate-report` | Cluster data → 3-paragraph NGO impact report |
| POST | `/pre-alert` | Region + pattern → predictive crisis warning |
| POST | `/verify-proof` | Volunteer image → AI fraud detection + verification result |

---

## Installation

**1. Navigate to the AI folder**
```bash
cd ai
```

**2. Create and activate a virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python -m venv venv
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Create a `.env` file**
```bash
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Get your Groq key free at console.groq.com  
Get your Gemini key free at aistudio.google.com/apikey

**5. Ensure `serviceAccountKey.json` exists in the backend folder**

This file is shared by the backend team and should never be committed to GitHub.

---

## Running the Server

```bash
python app.py
```

The server starts at `http://localhost:5000`

Health check: `http://localhost:5000/health`

Keep this running alongside the Node.js backend on port 3000.

---

## Demo Data

```bash
python seed_data.py seed    # Load 25 demo reports + 20 volunteers
python seed_data.py clear   # Remove all seeded data
python seed_data.py reset   # Clear and reload fresh
```
---

## Deployment

-Hosted on Railway (Flask API)
-Flow:
Frontend (Firebase) → Backend (Railway) → AI (Railway)

---
# Zunairah
# PULSE - Backend Documentation
## 🔗 Backend (Person B)
separate Backend for deployement: https://github.com/Zunairah-k/pulse-backend

### What I Built
- Firebase + Firestore database setup with 4 collections
- Express.js backend server running on port 3000
- Twilio WhatsApp + SMS dual intake pipeline
- IVR voice intake system in Hindi
- WhatsApp conversational bot for guided report collection
- Volunteer registration, geocoding, matching and auto-assignment
- Automatic task creation, tracking and status updates
- WhatsApp + SMS dual notifications to volunteers
- NGO registration and authentication system
- Hourly urgency escalation scheduler
- Analytics endpoint
- AI report generation proxy
- Demo trigger for live demonstrations
- Multilingual conversational bot (6 Indian languages)
- Smart message classification (direct vs guided intake)
- Multilingual IVR system with language selection
- Predictive alerts API integration
- Analytics dashboard API
- Frontend-triggered IVR simulation endpoint
- AI-powered Chatbot interface for real-time user interaction and guidance
- Intent-based chatbot system supporting reporting, analytics, and system explanation
- Quick action UI for faster access to key features (Report / About / Stats)
- Chatbot-to-frontend navigation system (intake form routing + message prefill)
- Unified frontend-backend chat integration with structured responses
- Real-time cluster action system with WhatsApp-based volunteer coordination (assign, reassign, force-assign, resolve workflow)
- Live cluster status tracking using Firestore onSnapshot (instant UI updates without refresh)
- Response tracking system for volunteers (assigned → accepted → resolved lifecycle monitoring)
- Time-based urgency intelligence layer including response delay tracking and “days unmet” crisis duration metric
- Fixed and completed **Volunteer Task Portal** with real-time data flow  (active, completed, task history) 
- Added **live availability control system** for volunteers synced with firestore  
- Introduced **resolution notes** for cluster closure tracking  
- Integrated **exact-location Google Maps links** in all task notifications for precise task navigation
- Multilingual React frontend (7 languages: English, Hindi, Telugu, Tamil, Marathi, Bengali, Urdu)
- Reusable LanguageSwitcher component integrated in Navbar, Landing, Login, and RoleSelect
- Translation JSON files for all 6 non-English languages covering every UI string
- Real-time language switching across all 10 pages without page reload
---

### Day 1
- Set up Firebase project with Firestore database on personal Google account
- Created 4 Firestore collections: `reports`, `volunteers`, `clusters`, `tasks`
- Built Express.js backend server running on port 3000
- Integrated Twilio WhatsApp sandbox
- Built `/incoming-message` route:
  - Receives WhatsApp messages from field workers
  - Saves raw message to Firestore instantly
  - Calls Person A's Flask AI server for analysis
  - Updates Firestore with need_type, urgency_score, language, summary, real coordinates
  - Triggers clustering automatically after each report
  - Replies to field worker confirming receipt
- Built `/register-volunteer` route:
  - Accepts name, email, skills, location, phone
  - Saves to Firestore `/volunteers` collection
- Built `/match-volunteers` route:
  - Takes a cluster_id
  - Finds all available volunteers with matching skills
  - Calculates distance using Haversine formula
  - Returns top 3 closest matching volunteers
- Built `/assign-volunteer` route:
  - Assigns volunteer to cluster
  - Creates task in `/tasks` collection
  - Marks volunteer as unavailable
- Built `/update-task` route:
  - Volunteer marks task accepted or done
  - Frees volunteer back up when done
- Built auto-assignment system:
  - When cluster urgency crosses 80/100 → automatically finds best volunteer
  - Creates task in Firestore without human input
  - Sends WhatsApp notification to volunteer
- Built `/sms-reply` route:
  - Volunteer replies ACCEPT → task status updates
  - Volunteer replies DONE → task complete, volunteer freed
    
- Bought real Twilio US number for SMS and Voice/IVR
- Built dual notification system — volunteers receive both WhatsApp AND SMS simultaneously
- Built IVR voice intake system:
  - Field worker calls PULSE number
  - System calls back with Hindi voice menu
  - Worker presses 1 (water), 2 (food), 3 (medical)
  - Records 30 second voice report
  - Saved to Firestore with `source: ivr`
  - Sent to AI for analysis automatically
- Built `/incoming-call` route — handles incoming voice calls via TwiML
- Built `/handle-keypress` route — processes IVR menu selection
- Built `/handle-recording` route — saves voice recording to Firestore
- Fixed Firestore composite index for cluster queries

  ---
  ### Day 2
  
- Connected frontend endpoints — verified all routes match Person C's calls
- Fixed skillMap to match frontend skill options
- Added volunteer location geocoding — text like "Hyderabad" auto-converts to real coordinates via OpenStreetMap Nominatim
- Updated `/incoming-message` to handle volunteer WhatsApp replies:
  - Volunteer replies ACCEPT → task confirmed, instructions sent back via WhatsApp
  - Volunteer replies DONE → task completed, volunteer freed up
  - Volunteer replies DECLINE → task reassigned, volunteer freed up
- Added NGO registration with Firebase Auth (`/register-ngo`)
- Added NGO login with custom token (`/login-ngo`)
- Added token verification middleware for protected routes
- Added hourly urgency escalation scheduler — runs automatically every hour
- Added `/analytics` endpoint — full system stats (reports, volunteers, clusters, tasks)
- Added `/generate-report` proxy — fetches cluster data, calls Person A's AI report generator
- Added `/demo-trigger` endpoint — fires 3 realistic demo reports automatically for live demo

---
### Day 3
- Built WhatsApp Conversational Bot — guided report collection for field workers:
  - If message is vague (e.g. "help", "problem hai") → bot starts guided conversation
  - If message is detailed → processed directly, bot skipped
  - Bot asks 4 questions: need type → people affected → days unmet → location
  - Conversation state stored in new Firestore `/conversations` collection
  - Conversations expire after 30 minutes automatically
  - Completed conversation creates a structured report in Firestore
  - AI enrichment fires automatically after bot completes
  - Field worker gets confirmation in Hindi with full report summary
  - Supports Hindi keywords (paani, khaana, bimaar etc.) alongside numbers
- Built Predictive Alert System:
  - Analyzes historical reports by region + need_type + month
  - Predicts upcoming crises based on seasonal patterns
  - Generates alerts with HIGH/MEDIUM/LOW confidence
  - Saves to new Firestore `/predictive_alerts` collection
  - Sends WhatsApp warning to NGO admin automatically
  - Runs daily, also runs on server startup
  - GET `/predictive-alerts` returns all active alerts for dashboard
- Built Multi-NGO Data Isolation:
  - Every report, volunteer, cluster tagged with `ngo_id`
  - NGO-scoped endpoints: `/ngo-reports`, `/ngo-volunteers`, `/ngo-clusters`, `/ngo-analytics`
  - Each NGO only sees their own data
  - NGO ID passed via `x-ngo-id` header or request body
  - `/register-volunteer-ngo` tags volunteers to specific NGO

---
### Day 4 — Multilingual + Advanced Intake + IVR Upgrade

- Upgraded WhatsApp conversational bot to support **6 languages**:
  Hindi, English, Telugu, Tamil, Marathi, Bengali
- Added automatic **language detection using AI**
- Bot dynamically switches language per user conversation
- Introduced **smart fallback logic**:
  - If message is detailed → skip bot → direct AI processing
  - If vague → guided conversation starts

- Improved conversation UX:
  - Fully localized prompts and confirmations
  - Language stored per user in `/conversations`

- Built **multilingual IVR system**:
  - Caller selects preferred language (Hindi, Telugu, Tamil, English)
  - Menu adapts to selected language
  - Voice prompts dynamically generated per language
  - Recording stored with language metadata

- Enhanced IVR reliability:
  - Switched to `app.all()` for Twilio compatibility
  - Added ngrok-based routing for live testing
  - Built `/start-call` endpoint to trigger IVR from frontend (demo mode)

- Improved AI enrichment pipeline:
  - Reports now tagged with detected language
  - Better context passed to AI for analysis

- Added **Predictive Alerts API integration**:
  - `/predictive-alerts` endpoint feeds frontend predictions page
  - Alerts generated using historical crisis patterns

- Built **Analytics API**:
  - `/analytics` endpoint provides:
    - Total reports, volunteers, tasks
    - Crisis type breakdown
    - Cluster severity distribution

---
## Day 5 — Intelligent Chatbot + Frontend UX Layer 

Built a fully interactive chatbot assistant (**PULSE AI Frontend Interface**) to improve real-time user interaction, reporting, and system navigation.

---

## Chatbot System (Frontend)

Developed a floating chatbot UI using React with:

- Framer Motion animations for smooth open/close transitions  
- Lucide React icon integration (`MessageCircle` icon)  
- Persistent chat state using React hooks  
- Auto-scroll to latest messages  
- Loading state simulation (“⚡ Thinking...”)  
- Action-based message rendering (buttons inside bot responses)  

---

## Quick Action Buttons

Added predefined quick actions for faster interaction:

- 🚨 Report Problem  
- 🤖 About PULSE  
- 📊 View Stats  

These allow users to trigger common queries without typing manually.

UI improvements:

- Full-width styled buttons  
- Color-coded actions (red / green / blue)  
- Better spacing + hover feedback  

---

## 🔗 Routing + Navigation Fix

Connected chatbot action buttons to React Router using `useNavigate()`.

Fixed internal vs external link handling:

- `/intake` → internal navigation  
- WhatsApp → external link handling  

Enabled query param based routing:

- `/intake?msg=...` → prefilled reports  

---

## Backend Integration

Chatbot communicates with backend via:

```http
POST /chat
```
## Backend Handling

Handles:

- User message classification  
- Intent detection  
- AI fallback response (Groq / LLM)  
- Structured response with optional `actions[]`  

---

## Smart Intent Handling (Backend)

### Report Mode

Detects emergency keywords (water, food, help, etc.)

Redirects user to:

- Intake form  
- WhatsApp reporting  

---

### Analytics Mode (FIXED)

Fetches live system stats from `/analytics`

**FIXED:** removed hardcoded values  

Now dynamically uses Firestore-backed data:

- People helped (derived from `total_affected`)  
- Total reports  
- Volunteers active  

---

### Alert Mode

Fetches predictive crisis alerts from `/predictive-alerts`

Returns:

- Top risk region  
- Confidence score  

---

### Info Mode

Explains how PULSE system works in simple terms  

---

### AI Fallback Mode

Groq LLM-based response for general queries when no intent is matched

---

## Intake System Upgrade

Intake page now supports prefilled chatbot messages:

Uses:

- `useLocation()` to read query params  
- Auto-fills message field  

AI pipeline remains powered via Flask `/analyze`

Firestore stores enriched reports:

- Urgency score  
- Affected people  
- Location parsing  
- Language detection  
- AI summary
  
---
## Day 6 — Cluster Action System + Real-time Assignment Tracking 

Built a complete cluster action management system for NGO dashboard control.

### Cluster Lifecycle Workflow
Added full workflow support for cluster actions:
- 🔄 Reassign cluster to a different volunteer  
- ⚡ Force-assign cluster for high urgency cases  
- ✅ Mark cluster as resolved with resolution note stored in backend  

### Real-time Notifications

- Integrated Twilio WhatsApp notification system for all assignment actions  
- Volunteers receive instant WhatsApp updates on assignment changes  
- Ensures real-time field coordination between NGO and volunteers  

### Live Status Tracking
- Implemented real-time cluster status tracking using Firestore sync  
- UI updates instantly via `onSnapshot` listeners  
- No manual refresh required  

### Status Flow Management
- Properly mapped workflow:  
  `Assigned → Accepted → Done → Resolved`  
- Fixed inconsistencies in status rendering across dashboard panels  

### Volunteer Response Tracking
- Tracks assignment timestamp (`assigned_at`)  
- Tracks acceptance and completion events  
- Displays real-time status transitions in UI 
- Includes “days unmet” metric to track unresolved duration since report creation 

### Delay & Urgency Indicators
- Shows:
  - Recently assigned  
  - Awaiting response  
  - No response states 
- Color-coded urgency urgency-based response tracking (green/yellow/red)

### Cluster Visualization Improvements
- High urgency clusters show expanded radius overlay  
- Medium/low urgency clusters dynamically styled  
- Unclustered reports displayed separately for clarity  

### UI/UX Enhancements
- Live Feed reflects real-time Firestore updates  
- Cluster Detail Panel now shows:
  - Assignment status  
  - Response timing  
  - Volunteer identity  
  - Resolution state  

### Bug Fixes
- Fixed mismatched `assigned_at` and status conditions  
- Corrected incorrect assignment state display in UI  
- Prevented stale cluster status rendering
---
## Day 7 — Volunteer Portal + Resolution notes + Navigation Updgrade
---

### Volunteer Task Portal (Built + Fixed)

Implemented a dedicated **Volunteer Portal** for task tracking and management.

The base UI existed but was not functional due to incorrect Firestore mapping and missing linkage between volunteers and tasks. Fixed the complete data flow and made the system fully operational.

#### Features:

- Volunteers can search tasks using their **phone number** (no authentication required)
- Real-time task fetching using Firestore `onSnapshot` *(live updates without refresh)*
- Tasks dynamically update as status changes

#### Task Categorization:

- **Active tasks** *(pending + accepted)*
- **Completed tasks** *(done)*
- **Total tasks count**

#### Bug Fix:

- Previously, tasks were not visible due to missing `volunteer_phone` field in `/tasks`
- Fixed backend to include `volunteer_phone` during task creation
- Updated frontend query to correctly fetch tasks using phone number

#### Result:

Volunteer portal is now fully functional with **real-time task visibility and tracking**

---

### Availability Toggle (Volunteer Control)

Added a **real-time availability control system** for volunteers.

#### Features:

- Toggle switch for:
  - **On Duty** (`available = true`)
  - **Off Duty** (`available = false`)
- Updates Firestore instantly upon interaction

#### Automatic Availability Logic:

- When a task is **accepted** → volunteer is marked as unavailable  
- When a task is **completed** → volunteer is marked as available again  

#### Implementation Details:

- Uses Firestore `updateDoc` on volunteer document
- UI state synchronized only after successful database update

---

### Resolution Notes in Cluster Dashboard

Enhanced the **cluster resolution workflow** to support detailed closure tracking.

#### Features:

- NGOs can mark clusters as resolved with a **custom resolution note** in the cluster panel of dashboard.

#### Data Stored:

- `resolution_note` — descriptive text explaining resolution  
- `resolved_at` — timestamp of resolution  

---

### Google Maps Link in Task Notifications (NEW)

Integrated precise navigation support for volunteers through **Twilio notifications**.

#### Feature Overview:

Volunteers receive a **direct Google Maps navigation link** for each assigned task with the exact Co-ordinates of the location where the report was made.

#### Applied Across All Assignment Flows:

- `/assign-volunteer`
- `autoAssignIfUrgent`
- `/reassign`
- `/force-assign`

#### Key Improvement:

- Uses coordinates of the **most urgent report within the cluster**
- Avoids using cluster centroid *(ensures higher accuracy)*

#### Implementation Details:

Generated using:
https://www.google.com/maps/dir/?api=1&destination=latitude,longitude


Injected into:

- WhatsApp message body  
- SMS message body  

#### Result:

- Enables **precise real-world navigation** for volunteers  
- Reduces response delay and location confusion  

---
## Day 8 — Multilingual Frontend (i18n)

Implemented full multilingual support across the entire React frontend.

- Installed and configured `i18next` + `react-i18next` with 7 language support: English, Hindi, Telugu, Tamil, Marathi, Bengali, Urdu
- Built reusable `LanguageSwitcher` component — compact toggle buttons (EN / हि / తె / த / म / বা / اُر) that switch the entire UI language instantly without page reload
- Integrated `LanguageSwitcher` into:
  - **Navbar** — desktop links bar + mobile hamburger menu
  - **Landing page** — top navigation bar
  - **Login page** — top right corner (absolute positioned)
  - **RoleSelect page** — top right corner (absolute positioned)
- Applied `useTranslation()` hook across all 10 pages:
  - Dashboard, Reports, Analytics, Tasks, Intake
  - Volunteer, VolunteerPortal, PredictiveAlerts, Login, RoleSelect
- Created translation JSON files for all 7 languages covering every UI string:
  - Labels, buttons, headings, error messages, placeholders, status indicators, loading states, empty states
- `en.json` serves as the master reference file for all translation keys
- English is also set as the hardcoded `fallbackLng` in `i18n.js` — if any key is missing in any language file, English renders as fallback automatically

### How It Works
User clicks language toggle (e.g. हि for Hindi)
↓
i18next switches active language globally
↓
Every t('key') call re-renders with Hindi value
↓
Entire UI updates instantly — no page reload
↓
Language persists across navigation within session

### Result

Every word visible in the PULSE dashboard — from cluster status labels to volunteer task buttons to NGO analytics charts to IVR simulation text — now switches language in real time when the toggle is clicked. Zero changes to any business logic, Firebase queries, API calls, or component structure. The translation layer is completely additive.

---
### Next Days
### Backend Improvements & Fixes (Later Stages)

- Fixed task assignment crashes by sanitizing undefined/null fields using a safe helper function  
- Stabilized Firestore task creation to prevent missing or invalid data issues  
- Improved auto-assignment flow for high-urgency clusters
- Successfully deployed backend on Railway for production use
- replaced all ai localhost links with deployed ai url
- Fixed production API URLs and ensured proper frontend-backend communication   
- Fixed IVR call trigger flow and backend endpoint handling  

---

### How The Full Pipeline Works
```
Field Worker intake — four methods:
  1. WhatsApp detailed message → processed directly (sandbox number)
  2. WhatsApp vague message → guided bot conversation (sandbox number) → structured report 
  3. SMS → (real Twilio number)
  4. Voice/IVR call → real number → Hindi menu → record problem
        ↓
Express server receives
        ↓
Saved to Firestore /reports instantly
        ↓
Person A's Flask AI server analyzes:
need_type + urgency_score + real coordinates + language + summary
        ↓
Firestore document updated with full analysis
        ↓
Clustering fires automatically
        ↓
If cluster urgency 80+ → auto assign nearest skilled volunteer
        ↓
Volunteer gets WhatsApp + SMS simultaneously
        ↓
Volunteer replies ACCEPT, DONE, or DECLINE → Firestore updates
        ↓
Hourly escalation runs — urgency increases for unresolved clusters
```

---

### API Routes

| Route | Method | What it does |
|---|---|---|
| `/` | GET | Test server is running |
| `/incoming-message` | POST | Receives WhatsApp — handles bot, volunteer replies, direct reports |
| `/incoming-call` | POST | Handles IVR voice call |
| `/handle-keypress` | POST | Processes IVR menu keypress |
| `/handle-recording` | POST | Saves voice recording to Firestore |
| `/register-volunteer` | POST | Registers new volunteer with geocoding |
| `/match-volunteers` | POST | Returns top 3 volunteers for a cluster |
| `/assign-volunteer` | POST | Assigns volunteer to cluster, creates task |
| `/update-task` | POST | Updates task status |
| `/sms-reply` | POST | Handles ACCEPT/DONE replies via SMS |
| `/register-ngo` | POST | Registers new NGO with Firebase Auth |
| `/login-ngo` | POST | NGO login, returns custom token |
| `/analytics` | GET | Full system stats |
| `/generate-report` | POST | Generates AI impact report for a cluster |
| `/demo-trigger` | POST | Fires full demo sequence automatically |

---
### Firestore Collections

| Collection | Purpose |
|---|---|
| `/reports` | All field reports — WhatsApp, SMS, IVR, bot |
| `/volunteers` | Registered volunteers with skills and location |
| `/clusters` | Grouped nearby same-type reports |
| `/tasks` | Volunteer assignments |
| `/ngos` | Registered NGO organizations |
| `/conversations` | Active WhatsApp bot conversations (auto-expire 30 mins) |

---
### Installation
```powershell
cd backend
npm install
```

### Packages

| Package | Purpose |
|---|---|
| firebase-admin | Connect to Firestore + Firebase Auth |
| express | Backend server |
| dotenv | Load environment variables |
| twilio | WhatsApp + SMS intake and notifications |
| @google/generative-ai | Gemini AI (ready, using Groq via Person A) |
| cors | Allow frontend to connect to backend |
| i18next | Core internationalization framework |
| react-i18next | React bindings for i18n |

### Environment Variables

Create a `.env` file inside the `backend` folder:
```
GEMINI_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=
TWILIO_REAL_NUMBER=
```

### Running The Full Backend

Three terminals needed:

Terminal 1 — Person A's AI server:
```powershell
cd ai
.\venv\Scripts\activate
python app.py
```

Terminal 2 — Node.js backend:
```powershell
cd backend
node index.js
```

Terminal 3 — Ngrok:
```powershell
cd backend
.\ngrok.exe http 3000
```

Copy the https URL → paste in:
- Twilio Sandbox → When a message comes in → Save
- Twilio Real Number → Voice: `/incoming-call` | SMS: `/sms-reply`
  
# Alizah
## Frontend (Person C) — React Dashboard

### What I Built
- React + Vite project setup with Tailwind CSS
- Firebase Firestore real-time connection + Firebase Auth (Google + Email)
- Google Maps integration with live cluster visualization + glow animations
- Landing page, Login/Register, and 10 core pages with shared Navbar
- Complete UI design system — dark glassmorphism theme with emerald green accents across all pages
- Live impact counter on landing page — pulls real numbers from backend `/analytics`
- IVR simulation button on landing page — shows live AI call processing flow
- WhatsApp chat simulation on landing page — shows live incoming field reports
- Volunteer registration form with organization name field connected to backend
- NGO registration with organization name — displayed in navbar after login
- Live feed sidebar with real-time incoming reports from Firestore onSnapshot
- Cluster detail side panel with AI report generation button + modal + copy to clipboard
- Manual report intake form for NGO coordinators — calls AI server, saves enriched data to Firestore
- Volunteer portal — phone lookup, availability toggle, task accept/done, task history, Google Maps directions
- Route protection — login required for all dashboard pages
- Demo trigger button — one click fires 3 live crisis reports on map instantly
- Predictive alerts banner — shows AI-predicted upcoming crises from backend
- Analytics page — live system stats, impact numbers, task breakdown charts with progress bars
- Mobile responsive navbar with hamburger menu
- 404 Not Found page + loading spinners throughout
- Firebase Hosting deployment — live production URL

### Pages Built
| Page | Route | What it does |
|---|---|---|
| Landing | `/` | Hero + IVR sim + WhatsApp sim + live activity feed + live impact counter |
| Login | `/login` | Firebase Auth — Google login or email/password + org name on register |
| Dashboard | `/dashboard` | Live Google Map + clusters + live feed + 🚀 Fire Demo + predictive alerts |
| Reports | `/reports` | Live incoming WhatsApp/SMS/IVR reports with urgency scores + language tags |
| Tasks | `/tasks` | Volunteer assignment tracker — pending, accepted, done with status icons |
| Volunteers | `/volunteers` | All registered volunteers + skills + organization + available/busy status |
| Analytics | `/analytics` | Live system stats — reports, clusters, volunteers, impact numbers, bar charts |
| Intake | `/intake` | NGO coordinator logs crisis → AI analyzes → enriched data saved to Firestore |
| Register | `/volunteer` | Volunteer registration with organization name field |
| My Tasks | `/my-tasks` | Volunteer portal — availability toggle, accept/done, task history, directions |

### UI Design System
All pages follow a unified dark glassmorphism design language matching the landing page:
- Background: `radial-gradient(circle_at_top, #0f172a, #020617)` deep space dark
- Primary accent: Emerald green (`#10b981`) for buttons, tags, highlights
- Cards: `bg-gradient-to-br from-gray-900/80 to-gray-800/50` with `border-white/10`
- Stats cards: Color-coded gradients per severity (red/orange/yellow/emerald)
- Hover effects: `scale-[1.02]` + `shadow-[0_0_20px_rgba(16,185,129,0.1)]` green glow
- Buttons: Emerald gradient with `shadow-[0_0_20px_rgba(16,185,129,0.3)]` glow
- Live indicators: Pulsing green dot on all real-time sections
- Input fields: `bg-gray-800/50 border-white/10` with emerald focus glow
- Tags/badges: Semi-transparent colored borders (`bg-emerald-500/20 border-emerald-500/30`)

### Map Features
- 🔴 Red marker = CRITICAL cluster (urgency 80+) — larger size, glow effect
- 🟠 Orange marker = HIGH cluster (urgency 50–79)
- 🟡 Yellow marker = MEDIUM cluster (below 50)
- 🔵 Blue dot = Individual unclustered report
- Cluster markers show report count as label
- Click cluster → side panel shows need type, villages, people affected, days unmet, response time, assignment status
- 📄 Generate AI Report button → calls `/generate-report` → modal with copy button
- 📡 Live Feed sidebar → real-time reports, hide/show toggle
- 🚀 Fire Demo button → calls `/demo-trigger` → 3 crisis reports fire live on map
- ⚠️ Predictive alerts banner → AI-predicted upcoming crises
- NGO Action Panel: Reassign, Force Assign, Mark Resolved buttons on each cluster
- Legend showing all marker types

### Auth Flow
- NGO coordinators → Login/Register via Google or Email at `/login`
- Organization name saved on register → displayed in navbar
- Volunteers → Register at `/volunteer`, check tasks at `/my-tasks` (no login needed)
- All dashboard pages protected — auto-redirects to `/login` if not authenticated
- Logout button in navbar clears Firebase session

### Deployment
Frontend deployed on Firebase Hosting: https://pulse-11de7.web.app
Steps taken:
```powershell
npm install -g firebase-tools
firebase login
cd frontend
npm run build
firebase init    # Hosting → pulse-11de7 → dist → SPA → Yes
firebase deploy
```

### Components Built
| Component | What it does |
|---|---|
| Navbar | Shared navbar — active links, org name display, logout, mobile hamburger menu |
| ProtectedRoute | Firebase Auth check — redirects unauthenticated users to `/login` |

### Installation
```powershell
cd frontend
npm install
```

### Environment Variables
Create a `.env` file inside the `frontend` folder:
VITE_GOOGLE_MAPS_API_KEY=your_key_here
### Running Frontend (Local)
```powershell
cd frontend
npm run dev
```
Opens at `http://localhost:5173`

### Packages Used
| Package | Purpose |
|---|---|
| react + vite | Frontend framework |
| react-router-dom | Page routing |
| firebase | Firestore real-time data + Firebase Auth + Hosting |
| @react-google-maps/api | Google Maps + Markers + InfoWindow |
| tailwindcss | Styling |
| framer-motion | Page animations and transitions |

### Running The Full System
```powershell
# Terminal 1 — AI server (Person A)
cd ai
.\venv\Scripts\activate
python app.py

# Terminal 2 — Backend (Person B)
cd backend
node index.js

# Terminal 3 — Frontend (Person C)
cd frontend
npm run dev
```

### Live Demo
Deployed URL: `https://pulse-11de7.web.app`

Demo credentials:
- Login with any Google account
- Or register with email/password + organization name
  
