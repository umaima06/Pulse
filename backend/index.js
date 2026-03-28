const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/', (req, res) => {
  res.send('PULSE backend is running!');
});

// Gemini analysis function
async function analyzeReport(rawText) {
  const prompt = `
You are an AI assistant for PULSE, an NGO crisis management system in India.
Analyze this field report and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Field report: "${rawText}"

Return exactly this JSON structure:
{
  "need_type": "water" or "food" or "medical",
  "urgency_score": a number between 1 and 100,
  "location": "extracted location name or empty string if not found",
  "language": "Hindi" or "Telugu" or "English" or "Mixed",
  "summary": "one clear sentence in English describing the problem"
}

Rules:
- need_type must be exactly "water", "food", or "medical"
- urgency_score: 80-100 for medical emergencies, 60-80 for severe shortages, 40-60 for moderate issues, 1-40 for minor issues
- summary must always be in English regardless of input language
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Clean response and parse JSON
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// Twilio sends incoming WhatsApp messages here
app.post('/incoming-message', async (req, res) => {
  try {
    const incomingText = req.body.Body;
    const senderNumber = req.body.From;

    console.log(`📩 New message from ${senderNumber}: ${incomingText}`);

    // First save raw message immediately
    const docRef = await db.collection('reports').add({
      raw_text: incomingText,
      sender: senderNumber,
      need_type: '',
      urgency_score: 0,
      location_text: '',
      location_lat: 0,
      location_lng: 0,
      language: '',
      summary: '',
      status: 'new',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Raw report saved to Firestore!');

    // Then analyze with Gemini
    console.log('🤖 Sending to Gemini for analysis...');
    const analysis = await analyzeReport(incomingText);
    console.log('✅ Gemini analysis:', analysis);

    // Update the same document with Gemini results
    await docRef.update({
      need_type: analysis.need_type,
      urgency_score: analysis.urgency_score,
      location_text: analysis.location,
      language: analysis.language,
      summary: analysis.summary,
      status: 'new'
    });

    console.log('✅ Report updated with Gemini analysis!');

    // Send reply back to field worker via WhatsApp
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>PULSE received your report. Issue: ${analysis.need_type}. Urgency: ${analysis.urgency_score}/100. Help is being coordinated.</Message>
      </Response>
    `);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).send('Error processing message');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 PULSE backend running on port ${PORT}`);
});