# PULSE Render Migration

This migration replaces the expired Railway backend with Render free web services while keeping the React/Vite frontend on Firebase Hosting.

## What Changed

- Removed all live frontend references to the expired Railway backend URL.
- Added shared frontend API helpers in `frontend/src/config/api.js`.
- Moved frontend backend and AI URLs to `VITE_BACKEND_URL` and `VITE_AI_URL`.
- Added Render Docker deployments for:
  - `backend/` Node.js Express API.
  - `ai/` Python Flask AI service.
- Added `render.yaml` for a two-service Render Blueprint.
- Configured Express CORS for:
  - `https://pulse-11de7.web.app`
  - `https://pulse-11de7.firebaseapp.com`
  - localhost and 127.0.0.1 development origins
  - optional extra origins through `CORS_ORIGINS`
- Configured Flask CORS with the same origin strategy.
- Replaced backend calls to `http://localhost:5000` with `AI_BASE_URL`.
- Added `FIREBASE_SERVICE_ACCOUNT_JSON` support for Firebase Admin on hosted environments.
- Updated Twilio IVR webhook URL generation to use `TWILIO_WEBHOOK_BASE_URL`.
- Replaced deprecated Google Maps `Marker` usage on the dashboard with `AdvancedMarkerElement`.

## Hosting Choice

Render is the recommended free migration target for this recovery because its official docs still support free web services for Node.js and Python. Fly.io is trial/credit oriented for new accounts, and Koyeb's free tier is less suitable for this two-service setup.

Render free services may spin down after inactivity. First request after sleep can be slow, so demo flows should be warmed up before presentations.

## Deployment URLs

Fill these in after Render creates the services:

- Backend API: `https://<your-pulse-backend>.onrender.com`
- AI service: `https://<your-pulse-ai>.onrender.com`
- Frontend: `https://pulse-11de7.web.app`

Do not guess these values. Copy them from the Render dashboard after deployment.

## Required Environment Variables

### Firebase Hosting frontend

Set these before building/deploying the frontend:

```bash
VITE_BACKEND_URL=https://<your-pulse-backend>.onrender.com
VITE_AI_URL=https://<your-pulse-ai>.onrender.com
VITE_GOOGLE_MAPS_API_KEY=<browser_maps_key>
VITE_GOOGLE_MAP_ID=<google_maps_map_id>
VITE_WHATSAPP_NUMBER=<twilio_whatsapp_number>
```

Firebase config variables are optional because the current `pulse-11de7` values remain fallback defaults:

```bash
VITE_FIREBASE_API_KEY=<firebase_web_api_key>
VITE_FIREBASE_AUTH_DOMAIN=pulse-11de7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pulse-11de7
VITE_FIREBASE_STORAGE_BUCKET=pulse-11de7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=383499078117
VITE_FIREBASE_APP_ID=1:383499078117:web:dc5a48db35b128abb3470c
```

### Render backend service

```bash
AI_BASE_URL=https://<your-pulse-ai>.onrender.com
FRONTEND_PUBLIC_URL=https://pulse-11de7.web.app
BACKEND_PUBLIC_URL=https://<your-pulse-backend>.onrender.com
TWILIO_WEBHOOK_BASE_URL=https://<your-pulse-backend>.onrender.com
CORS_ORIGINS=https://pulse-11de7.web.app,https://pulse-11de7.firebaseapp.com
FIREBASE_SERVICE_ACCOUNT_JSON=<full Firebase service account JSON on one line>
TWILIO_ACCOUNT_SID=<twilio_account_sid>
TWILIO_AUTH_TOKEN=<twilio_auth_token>
TWILIO_PHONE_NUMBER=<twilio_whatsapp_sender_number>
TWILIO_REAL_NUMBER=<twilio_voice_or_sms_number>
MY_PHONE_NUMBER=<optional_default_ivr_demo_recipient>
```

### Render AI service

```bash
CORS_ORIGINS=https://pulse-11de7.web.app,https://pulse-11de7.firebaseapp.com
GROQ_API_KEY=<groq_api_key>
GEMINI_API_KEY=<gemini_api_key>
```

## Google Maps Console Actions

The dashboard requires a valid Maps JavaScript API browser key.

1. Open Google Cloud Console for the project that owns the key.
2. Enable **Maps JavaScript API**.
3. Create or confirm a **Map ID** for Advanced Markers.
4. Add `VITE_GOOGLE_MAP_ID` to the frontend environment.
5. Restrict the browser key by HTTP referrer:
   - `https://pulse-11de7.web.app/*`
   - `https://pulse-11de7.firebaseapp.com/*`
   - `http://localhost:5173/*`
   - `http://127.0.0.1:5173/*`
6. Confirm billing is enabled if Google requires it for the project.

`ApiProjectMapError` normally means the key belongs to the wrong Google Cloud project, the API is disabled, billing is unavailable, or referrer restrictions do not match the deployed domain.

`NoApiKeys` means `VITE_GOOGLE_MAPS_API_KEY` was not present at build time.

## Firebase Notes

- Firestore and Firebase Auth remain on project `pulse-11de7`.
- Frontend Firebase config can be overridden with `VITE_FIREBASE_*` variables, but the existing values remain as fallbacks.
- Backend Firebase Admin now reads `FIREBASE_SERVICE_ACCOUNT_JSON` on Render.
- Never commit `serviceAccountKey.json`; keep it only for local development.

## Twilio Webhooks

After Render backend deployment, update Twilio webhook URLs:

- WhatsApp incoming message webhook: `https://<your-pulse-backend>.onrender.com/incoming-message`
- SMS reply webhook: `https://<your-pulse-backend>.onrender.com/sms-reply`
- Voice call webhook: `https://<your-pulse-backend>.onrender.com/incoming-call`

Set `TWILIO_WEBHOOK_BASE_URL` to the backend Render URL so generated IVR redirects use the hosted backend instead of ngrok.

## AI Endpoint Verification

After deploying both services, verify:

```bash
curl https://<your-pulse-ai>.onrender.com/health
curl -X POST https://<your-pulse-ai>.onrender.com/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Need water in Hyderabad for 50 people\"}"
curl -X POST https://<your-pulse-backend>.onrender.com/demo-trigger
```

The backend proxies or uses AI for `/analyze`, `/cluster`, `/escalate`, `/generate-report`, `/verify-proof`, and `/ask-ai`.

## COOP Warning

The Cross-Origin-Opener-Policy `window.close` warning is commonly emitted by Google/Firebase popup flows in modern browsers. It is a browser security warning, not a backend outage. If popup auth stops working, switch the auth flow to Firebase redirect sign-in; no migration-specific backend change is required.
