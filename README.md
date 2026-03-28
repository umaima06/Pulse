# Pulse
PULSE is an AI-powered decision system for NGOs that collects scattered community data, identifies the most urgent needs, and helps allocate volunteers and resources smartly — even without internet access.


# Umaima
@ day 1:
Step 1 — Get your Gemini API key
step 2 — Three Python files, all running cleanly:
intelligence.py — Gemini converts any messy input to structured JSON ✓
clustering.py — Groups nearby same-type reports into clusters ✓
matching.py — Ranks volunteers by skill + distance + availability ✓
step 3- install :
1. python -m venv venv, .\venv\Scripts\activate
2. pip install google-genai



# Zunairah
# PULSE - Backend Documentation

## Backend (Person B)

### What I Built
- Firebase + Firestore database setup with 4 collections
- Express.js backend server
- Twilio WhatsApp intake pipeline
- Gemini AI integration (ready, needs API key from Person A)

### Day 1
- Set up Firebase project with Firestore database
- Created 4 Firestore collections: `reports`, `volunteers`, `clusters`, `tasks`
- Built Express.js backend server running on port 3000
- Integrated Twilio WhatsApp sandbox
- Built `/incoming-message` route that:
  - Receives WhatsApp messages from field workers
  - Saves raw message to Firestore instantly
  - Sends to Gemini for analysis
  - Updates Firestore document with need_type, urgency_score, language, summary
  - Replies to field worker confirming receipt

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
Gemini analyzes: need_type + urgency_score + summary
        ↓
Firestore document updated with full analysis
```

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
| twilio | Receive WhatsApp messages |
| @google/generative-ai | Gemini AI analysis |
| cors | Allow frontend to connect to backend |

### Environment Variables
Create a `.env` file inside the `backend` folder:
```
GEMINI_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=your_twilio_number_here
```

### Running The Backend
```powershell
cd backend
node index.js
```

### Exposing Backend With Ngrok
In a second terminal:
```powershell
cd backend
.\ngrok.exe http 3000
```
Copy the https URL → paste in Twilio Sandbox Configuration → When a message comes in → Save

# Alizah

