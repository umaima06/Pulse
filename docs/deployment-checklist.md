# PULSE Deployment Checklist

## 1. Render

- Create a Render Blueprint from this fork.
- Confirm two services are created:
  - `pulse-backend`
  - `pulse-ai`
- Set all backend secret environment variables.
- Set all AI secret environment variables.
- Copy the final Render URLs.
- Set backend `AI_BASE_URL` to the AI service URL.
- Set backend `BACKEND_PUBLIC_URL` and `TWILIO_WEBHOOK_BASE_URL` to the backend service URL.
- Redeploy backend after updating URL env vars.
- Verify:
  - `GET /` on backend.
  - `GET /health` on AI.
  - `POST /demo-trigger` on backend.
  - `POST /analyze` on AI.

## 2. Firebase Hosting

- Create or update `frontend/.env` using `frontend/.env.example`.
- Set:
  - `VITE_BACKEND_URL`
  - `VITE_AI_URL`
  - `VITE_GOOGLE_MAPS_API_KEY`
  - `VITE_GOOGLE_MAP_ID`
- Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

- Deploy:

```bash
firebase deploy --only hosting
```

## 3. Google Maps

- Enable Maps JavaScript API.
- Create a Map ID for Advanced Markers.
- Restrict the API key to Firebase Hosting and localhost referrers.
- Confirm the dashboard loads without `NoApiKeys` or `ApiProjectMapError`.
- Confirm crisis clusters and individual reports appear as map markers.

## 4. Firebase

- Confirm Firestore collections are still available:
  - `reports`
  - `clusters`
  - `volunteers`
  - `tasks`
  - `ngos`
- Confirm Firebase Auth still accepts the intended Google sign-in domains.
- Confirm backend `FIREBASE_SERVICE_ACCOUNT_JSON` is valid.

## 5. Twilio

- Update Twilio WhatsApp webhook to `/incoming-message`.
- Update SMS webhook to `/sms-reply`.
- Update voice webhook to `/incoming-call`.
- Confirm `TWILIO_PHONE_NUMBER` is the raw sender number, for example `+14155238886`.
- Confirm `TWILIO_REAL_NUMBER` is the voice/SMS-capable Twilio number.
- Test:
  - WhatsApp report intake.
  - Volunteer `ACCEPT`, `DONE`, and proof photo flow.
  - SMS reply flow.
  - IVR demo call.

## 6. App Sanity Checks

- Dashboard loads Firestore reports and clusters.
- Fire Demo creates reports and clusters.
- Generate Report returns AI output.
- Chatbot returns quick intent responses and AI fallback.
- Intake form analyzes and saves reports.
- Volunteer registration posts to backend.
- Volunteer portal can accept and complete tasks.
- Analytics page reads backend analytics.
- Predictive alerts page reads backend predictions.
