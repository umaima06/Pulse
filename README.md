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
@ day 1----
Step 1 — Get your Gemini API key
step 2 — Three Python files, all running cleanly:
intelligence.py — Gemini converts any messy input to structured JSON ✓
clustering.py — Groups nearby same-type reports into clusters ✓
matching.py — Ranks volunteers by skill + distance + availability ✓
step 3- install :
1. python -m venv venv, .\venv\Scripts\activate
2. pip install google-genai

@ day 2----
install:
1. pip install flask flask-cors
2. pip install groq
used Nominatim which is OpenStreetMap's geocoder. Works for any location in India or anywhere in the world. No API key, no billing, completely free.

@ day 3,4,5,6 ------
# Overview
Built the complete AI brain for PULSE X. Every field report that enters 
the system — WhatsApp, SMS, or manual intake — passes through this layer 
before anything else happens.

@ random day 1---
🔧 Updates & Fixes (Today)
🗺️ Map Fix
Resolved issues with map rendering and data display. The map now correctly reflects real-time report/cluster data.
Fixed incorrect/missing markers on the map
Added blue dots to represent individual reports that are not part of any cluster
This ensures:
No report is visually lost
Both clustered and non-clustered cases are clearly visible

🎬 Demo System Overhaul
Rebuilt the demo flow to make testing and presentations reliable:
Added a demo trigger that generates fresh reports every time (food, water, medical)
Ensured demo data is randomized and realistic
Implemented a clear demo feature that removes all demo data from:
Frontend UI
Firestore database
Eliminated stale/duplicate demo data issues

📊 Dynamic Dashboard (Navbar Fix)
Previously, dashboard values (like counts/stats) were hardcoded.
Now:
All navbar data is fetched dynamically from backend
Reflects real-time system state
Improves accuracy and scalability

📱 Twilio WhatsApp Alert Fix
Fixed a critical issue where volunteers were receiving incorrect alerts:
Before:
Every alert showed "urgent water crisis" regardless of actual issue ❌
After:
Alerts now correctly reflect:
Actual need type (water / food / medical)
Relevant report-level details
Ensures volunteers receive accurate and actionable information ✅
📩 New Message Format
Volunteers now receive messages in this format:
🚨 PULSE TASK ASSIGNED
📍 Location: <Exact Location>
⚠️ Issue: <Water / Food / Medical>
👥 People affected: <Number>
📝 Details: <Summary (if available)>
Reply ACCEPT to confirm.
This removes ambiguity and ensures the volunteer knows exactly where to go and what to handle.

@random day 2---
🤖 AI-Powered Proof Verification (Gemini Vision)

This system uses AI-based visual verification to ensure that volunteer-submitted proof images genuinely reflect completed field tasks. Instead of relying on basic checks like whether an image exists online, the backend sends the submitted image to Gemini Vision API, which analyzes the actual visual content.

The AI evaluates whether the image matches the assigned task context. For example, if the task involves water distribution, the system verifies the presence of relevant elements such as water containers, distribution activity, volunteers in action, or people receiving aid. It also assesses authenticity signals (e.g., real field conditions vs. stock or staged images) and contextual plausibility.

Only when the AI confirms that the image is both relevant and authentic is the task marked as completed. This approach ensures higher reliability, prevents fraudulent submissions, and enables trustworthy, automated verification at scale without manual intervention.

🔑 Gemini API Setup
Go to https://aistudio.google.com/
Sign in and generate your Google Gemini API Key
Copy the API key
Add it to your environment file:
GEMINI_API_KEY="YOUR_API_KEY"

📌 Add this in:

backend/.env
ai/.env

Make sure to restart your server after adding the key.

# What I Built

# Core AI Pipeline
- **intelligence.py** — Takes any raw text in any Indian language (Hindi, 
  Telugu, Tamil, English, mixed) and returns structured crisis data using 
  Groq's Llama 3.3 70B model with Gemini 2.5 Flash as automatic fallback
- **clustering.py** — Groups nearby reports of the same crisis type into 
  clusters using Haversine distance formula (30km radius)
- **matching.py** — Ranks available volunteers by skill match, distance, 
  and availability for each crisis cluster
- **report_generator.py** — Generates professional 3-paragraph NGO impact 
  reports and 2-sentence predictive pre-alerts using Groq
- **config.py** — All settings in one place. Crisis types, urgency rules, 
  skill matrix, thresholds — nothing hardcoded anywhere else

  # Frontend Integration (Done by Person A)

Connected all AI endpoints to the React frontend:

- **Dashboard.jsx** — clusters now sorted by urgency, reports filtered 
  to analyzed only, cluster detail panel shows villages/people/days instead 
  of raw coordinates
- **Reports.jsx** — shows only analyzed reports ordered by newest first
- **Intake.jsx** — manual report form now calls `/analyze` directly, 
  gets real AI analysis back, saves enriched data straight to Firestore 
  with real coordinates. Shows urgency score and summary to coordinator 
  immediately after submission.
- **firebase.js** — confirmed working with project credentials
- **Firestore indexes** — created composite indexes for 
  `status + timestamp` and `status + location_lat` queries

# API Server
- **app.py** — Flask server exposing all AI functions as HTTP endpoints 
  on port 5000. Node.js backend and React frontend both call this.

# Demo Data
- **seed_data.py** — Seeds 25 realistic crisis reports across 15 Indian 
  states and 20 volunteer profiles into Firestore

# API Endpoints

| Endpoint | Does what |
|----------|-----------|
| GET /health | Check server is alive |
| POST /analyze | Any text → structured crisis data + real coordinates |
| POST /cluster | Array of reports → grouped crisis clusters |
| POST /match | Cluster + volunteers → ranked matches |
| POST /escalate | Recalculates urgency scores over time |
| POST /generate-report | Cluster data → 3-paragraph NGO report |
| POST /pre-alert | Region + pattern → predictive warning |

# PULSE X — AI Layer (Person A)


## What This Does

Takes any field report — a WhatsApp message in Telugu, a Hindi voice 
transcript, a vague SMS — and automatically:

1. Understands what crisis it is (water / food / medical)
2. Scores how urgent it is (1–100)
3. Finds the real coordinates of the location anywhere in India
4. Groups nearby same-type reports into crisis clusters
5. Matches the best available volunteer to each cluster
6. Writes a professional NGO impact report

Zero manual work. Fully automatic.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Python 3.x | Core language |
| Groq (llama-3.3-70b) | Primary AI — analysis + report writing |
| Gemini 2.5 Flash | Auto fallback if Groq fails |
| OpenStreetMap Nominatim | Free geocoding — any location in India |
| Flask | API server (port 5000) |
| Firebase Firestore | Database |

---

## Files
| File | What it does |
|------|-------------|
| intelligence.py | Reads any report → extracts need type, urgency, location, coordinates |
| clustering.py | Groups nearby same-type reports into crisis clusters |
| matching.py | Ranks volunteers by skill + distance + availability |
| config.py | All settings in one place — change anything here |
| app.py | Flask server exposing everything as API endpoints |
| report_generator.py | Generates professional NGO impact reports |
| seed_data.py | Loads 25 demo reports + 20 volunteers into Firestore |

### Installation

**1. Navigate to the ai folder**
```bash
cd ai
```

**2. Create and activate virtual environment**
```bash
# Create
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — Mac/Linux
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Create your .env file**
```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
```

Get Groq key free → console.groq.com  
Get Gemini key free → aistudio.google.com/apikey

**5. Add serviceAccountKey.json**

Make sure `../backend/serviceAccountKey.json` exists.  
(Person B shares this — never commit it to GitHub)

---

## Running the Server
```bash
python app.py
```

Server starts at: http://localhost:5000  
Health check: http://localhost:5000/health

> Keep this running alongside Person B's Node server (port 3000)

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | /health | Check server is running |
| POST | /analyze | Any text → structured crisis data + coordinates |
| POST | /cluster | Array of reports → grouped clusters |
| POST | /match | Cluster + volunteers → ranked matches |
| POST | /escalate | Recalculates urgency for unresponded reports |
| POST | /generate-report | Cluster data → 3-paragraph NGO report |
| POST | /pre-alert | Region + pattern → predictive warning |

---

## What Person C reads from Firestore
- /clusters → centroid_lat, centroid_lon, combined_urgency, alert_level
- /reports → summary, need_type, urgency_score, location_lat, location_lng
- Call POST /generate-report to get NGO report for any cluster

## Demo Data
```bash
python seed_data.py seed    # load demo data
python seed_data.py reset   # fresh start
```


# Zunairah
# PULSE - Backend Documentation
## Backend (Person B)

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
- Landing page, Login/Register, and 8 core pages with shared Navbar
- Volunteer registration form connected to backend
- Live feed sidebar with real-time incoming reports
- Cluster detail side panel with AI report generation button + modal
- Manual report intake form for NGO coordinators
- Volunteer portal — phone lookup, task accept/done buttons
- Route protection — login required for dashboard pages
- 404 Not Found page + loading spinners throughout

### Pages Built
| Page | Route | What it does |
|---|---|---|
| Landing | `/` | Hero page — what PULSE is, how it works, stats, CTA |
| Login | `/login` | Firebase Auth — Google login or email/password register |
| Dashboard | `/dashboard` | Live Google Map + color-coded crisis clusters + live feed |
| Reports | `/reports` | Live incoming WhatsApp field reports with urgency scores |
| Tasks | `/tasks` | Volunteer assignment tracker — pending, accepted, done |
| Volunteers | `/volunteers` | All registered volunteers + available/busy status |
| Intake | `/intake` | NGO coordinator manually logs a crisis report |
| Register | `/volunteer` | Volunteer registration form → saves to Firestore via backend |
| My Tasks | `/my-tasks` | Volunteer portal — enter phone, see tasks, accept or complete |

### Map Features
- 🔴 Red circles = CRITICAL clusters (urgency 80+) with outer glow effect
- 🟠 Orange circles = HIGH (urgency 50–79)
- 🟡 Yellow circles = MEDIUM (below 50)
- Click any circle → side panel shows cluster details, need type, urgency bar
- 📄 Generate AI Report button → calls Person A's Flask `/generate-report` endpoint → shows in modal
- 📡 Live Feed sidebar → real-time incoming reports from Firestore onSnapshot
- Hide/Show feed toggle button on map

### Auth Flow
- NGO coordinators → Login/Register via Google or Email at `/login`
- Volunteers → Register at `/volunteer`, check tasks at `/my-tasks` (no login needed)
- All dashboard pages protected — redirects to `/login` if not authenticated
- Logout button in navbar

### Components Built
| Component | What it does |
|---|---|
| Navbar | Shared navbar with active link highlighting + logout button |
| ProtectedRoute | Wraps dashboard pages — redirects unauthenticated users to login |

### Installation
```powershell
cd frontend
npm install
```

### Environment Variables
Create a `.env` file inside the `frontend` folder:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Running Frontend
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
| firebase | Firestore real-time data + Firebase Auth |
| @react-google-maps/api | Google Maps + Circles |
| tailwindcss | Styling |

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
