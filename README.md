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


# Zunairah
# PULSE - Backend Documentation
## Backend (Person B)

### What I Built
- Firebase + Firestore database setup with 4 collections
- Express.js backend server
- Twilio WhatsApp intake pipeline
- Volunteer registration, matching and auto-assignment system
- Automatic task creation and tracking
- SMS/WhatsApp notification to volunteers

### Day 1
- Set up Firebase project with Firestore database
- Created 4 Firestore collections: `reports`, `volunteers`, `clusters`, `tasks`
- Built Express.js backend server running on port 3000
- Integrated Twilio WhatsApp sandbox
- Built `/incoming-message` route that:
  - Receives WhatsApp messages from field workers
  - Saves raw message to Firestore instantly
  - Calls Person A's Flask AI server for analysis
  - Updates Firestore document with need_type, urgency_score, language, summary, real coordinates
  - Triggers clustering automatically after each report
  - Replies to field worker confirming receipt
- Built `/register-volunteer` route:
  - Accepts volunteer name, email, skills, location, phone
  - Saves to Firestore `/volunteers` collection
- Built `/match-volunteers` route:
  - Takes a cluster_id
  - Finds all available volunteers with matching skills
  - Calculates distance from volunteer to cluster using Haversine formula
  - Returns top 3 closest matching volunteers
- Built `/assign-volunteer` route:
  - Assigns a specific volunteer to a cluster
  - Creates a task in `/tasks` collection
  - Marks volunteer as unavailable
- Built `/update-task` route:
  - Volunteer marks task as accepted or done
  - Frees volunteer back up when done
- Built auto-assignment system:
  - When cluster urgency crosses 80/100 → automatically finds best volunteer
  - Creates task in Firestore without any human input
  - Sends WhatsApp notification to volunteer
- Built `/sms-reply` route:
  - Volunteer replies ACCEPT → task status updates to accepted
  - Volunteer replies DONE → task marked complete, volunteer freed up

### How The Pipeline Works
```
Field Worker sends WhatsApp message
        ↓
Twilio receives it
        ↓
Sent to Express server (/incoming-message)
        ↓
Saved to Firestore /reports collection
        ↓
Person A's Flask AI server analyzes:
need_type + urgency_score + real coordinates + summary
        ↓
Firestore document updated with full analysis
        ↓
Clustering fires automatically
        ↓
If cluster urgency 80+ → auto assign best volunteer
        ↓
Task created in /tasks → volunteer notified via WhatsApp
        ↓
Volunteer replies ACCEPT or DONE → Firestore updates
```

### API Routes
| Route | Method | What it does |
|---|---|---|
| `/` | GET | Test server is running |
| `/incoming-message` | POST | Receives WhatsApp from field worker |
| `/register-volunteer` | POST | Registers a new volunteer |
| `/match-volunteers` | POST | Returns top 3 volunteers for a cluster |
| `/assign-volunteer` | POST | Assigns volunteer to cluster, creates task |
| `/update-task` | POST | Updates task status |
| `/sms-reply` | POST | Handles ACCEPT/DONE replies from volunteers |

### Installation
```powershell
cd backend
npm install
```

### Packages
| Package | Purpose |
|---|---|
| firebase-admin | Connect to Firestore database |
| express | Backend server |
| dotenv | Load environment variables |
| twilio | Receive and send WhatsApp messages |
| @google/generative-ai | Gemini AI (ready, currently using Groq via Person A) |
| cors | Allow frontend to connect to backend |

### Environment Variables
Create a `.env` file inside the `backend` folder:
```
GEMINI_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=your_twilio_number_here
```

### Running The Full Backend
Two servers need to run simultaneously:

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
Copy the https URL → paste in Twilio Sandbox Configuration → When a message comes in → Save


# Alizah

## Frontend (Person C) — React Dashboard

### What I Built
- React + Vite project setup with Tailwind CSS
- Firebase Firestore real-time connection
- Google Maps integration with live cluster visualization
- 5 pages with shared Navbar and routing
- Volunteer registration form connected to backend

### Pages Built
| Page | Route | What it does |
|---|---|---|
| Dashboard | `/` | Live Google Map with color-coded crisis clusters |
| Reports | `/reports` | Live incoming WhatsApp field reports |
| Tasks | `/tasks` | Volunteer assignment tracker |
| Volunteers | `/volunteers` | All registered volunteers + availability |
| Register | `/volunteer` | Volunteer registration form → saves to Firestore via backend |

### Map Features
- 🔴 Red circles = CRITICAL clusters (urgency 80+)
- 🟠 Orange circles = HIGH (urgency 50–79)
- 🟡 Yellow circles = MEDIUM (below 50)
- Click any circle → side panel shows cluster details, need type, urgency bar

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
| firebase | Firestore real-time data |
| @react-google-maps/api | Google Maps + Circles |
| tailwindcss | Styling |
