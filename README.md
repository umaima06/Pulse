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
│
├── ai/                            ← Person A — Python AI brain
│   ├── app.py                     ← Flask server running on port 5000
│   ├── intelligence.py            ← Groq AI analysis + urgency scoring
│   ├── clustering.py              ← Groups nearby reports into clusters
│   ├── matching.py                ← Volunteer skill + distance matching
│   ├── config.py                  ← AI configuration
│   ├── requirements.txt           ← Python dependencies
│   └── .env                       ← Groq API key (not on GitHub)
│
├── frontend/                      ← Person C — React dashboard
│   └── (in progress)
│
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

# PULSE X — AI Layer (Person A)

## What I Built
The brain of PULSE X. Takes any messy field report 
(WhatsApp, SMS, voice transcript) in any Indian language 
and turns it into structured, actionable crisis data.

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

## How to Run
```bash
cd ai
venv\Scripts\activate
python app.py
```
Runs on http://localhost:5000

## API Endpoints Person B Calls
| Endpoint | Does what |
|----------|-----------|
| POST /analyze | Any text in → structured crisis data out |
| POST /cluster | Groups reports into clusters |
| POST /match | Finds best volunteers for a cluster |
| POST /escalate | Updates urgency scores over time |
| POST /generate-report | Writes NGO impact report |

## AI Stack
- Primary: Groq (llama-3.3-70b) — free, fast, great at Hindi/Telugu
- Fallback: Gemini 2.5 Flash — auto-switches if Groq fails

## .env needed
```
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

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
- Volunteer registration, geocoding, matching and auto-assignment
- Automatic task creation, tracking and status updates
- WhatsApp + SMS dual notifications to volunteers
- NGO registration and authentication system
- Hourly urgency escalation scheduler
- Analytics endpoint
- AI report generation proxy
- Demo trigger for live demonstrations

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

### How The Full Pipeline Works
```
Field Worker intake — three methods:
  1. WhatsApp message → (sandbox number)
  2. SMS → (real number)
  3. Voice/IVR call → real number → Hindi menu → record problem
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
| `/incoming-message` | POST | Receives WhatsApp/replies from field workers and volunteers |
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
