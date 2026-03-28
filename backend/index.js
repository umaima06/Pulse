const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/', (req, res) => {
  res.send('PULSE backend is running!');
});

// // Gemini analysis function
// async function analyzeReport(rawText) {
//   const prompt = `
// You are an AI assistant for PULSE, an NGO crisis management system in India.
// Analyze this field report and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

// Field report: "${rawText}"

// Return exactly this JSON structure:
// {
//   "need_type": "water" or "food" or "medical",
//   "urgency_score": a number between 1 and 100,
//   "location": "extracted location name or empty string if not found",
//   "language": "Hindi" or "Telugu" or "English" or "Mixed",
//   "summary": "one clear sentence in English describing the problem"
// }

// Rules:
// - need_type must be exactly "water", "food", or "medical"
// - urgency_score: 80-100 for medical emergencies, 60-80 for severe shortages, 40-60 for moderate issues, 1-40 for minor issues
// - summary must always be in English regardless of input language
// `;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text().trim();
  
//   // Clean response and parse JSON
//   const cleaned = text.replace(/```json|```/g, '').trim();
//   return JSON.parse(cleaned);
// }

// PULSE AI enrichment — calls Person A's Python server
async function enrichWithPULSEAI(reportId, rawText) {
  try {
    const res = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText })
    });
    const analysis = await res.json();
    if (!analysis.success) return;

    const d = analysis.data;
    const coords = d.coordinates || {};

    await db.collection('reports').doc(reportId).update({
      need_type:       d.need_type,
      urgency_score:   d.urgency_score,
      urgency_raw:     d.urgency_raw,
      affected_people: d.affected_people,
      days_unmet:      d.days_unmet,
      summary:         d.summary,
      language:        d.language_detected,
      confidence:      d.confidence,
      location_text:   d.location?.description || '',
      district:        d.location?.district || '',
      state:           d.location?.state || '',
      location_lat:    coords.lat || 0,      // ← real coordinates now
      location_lng:    coords.lon || 0,      // ← from Nominatim geocoding
      status:          'analyzed',
      analyzed_at:     admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Report ${reportId} enriched | Coords: ${coords.lat}, ${coords.lon}`);

    // Trigger clustering only if we have coordinates
    if (!coords.lat) return;

    const snapshot = await db.collection('reports')
      .where('status', '==', 'analyzed')
      .where('location_lat', '>', 0)
      .get();

    if (snapshot.size < 1) return;

    const reports = snapshot.docs.map(doc => ({
      id:              doc.id,
      need_type:       doc.data().need_type,
      urgency_score:   doc.data().urgency_score,
      lat:             doc.data().location_lat,
      lon:             doc.data().location_lng,
      affected_people: doc.data().affected_people || 0
    }));

    const clusterRes = await fetch('http://localhost:5000/cluster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports })
    });
    const clusterData = await clusterRes.json();

    const batch = db.batch();
    for (const cluster of clusterData.clusters) {
      const ref = db.collection('clusters').doc(cluster.cluster_id);
      batch.set(ref, {
        ...cluster,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    console.log(`✅ ${clusterData.cluster_count} clusters updated`);

  } catch (err) {
    console.error('❌ PULSE AI failed:', err.message);
  }
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

    console.log('✅ Raw report saved to Firestore!', docRef.id);
    // Add this line right after raw report is saved
    enrichWithPULSEAI(docRef.id, incomingText).catch(console.error);

    // // Then analyze with Gemini
    // console.log('🤖 Sending to Gemini for analysis...');
    // const analysis = await analyzeReport(incomingText);
    // console.log('✅ Gemini analysis:', analysis);

    // // Update the same document with Gemini results
    // await docRef.update({
    //   need_type: analysis.need_type,
    //   urgency_score: analysis.urgency_score,
    //   location_text: analysis.location,
    //   language: analysis.language,
    //   summary: analysis.summary,
    //   status: 'new'
    // });

    // console.log('✅ Report updated with Gemini analysis!');

    // Send reply back to field worker via WhatsApp
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
      <Message>PULSE received your report. We are analyzing and coordinating help now.</Message>
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