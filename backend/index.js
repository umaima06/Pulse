require('dotenv').config(); // always first

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const twilio = require('twilio'); // MUST COME BEFORE CLIENT
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
app.get('/test', (req, res) => {
  res.send("TEST WORKING");
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────

// Distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Skills needed per need type
const skillMap = {
  water:   ['water', 'water_distribution', 'transport', 'rescue'],
  food:    ['food', 'food_distribution', 'transport'],
  medical: ['medical', 'doctor', 'nurse', 'first_aid']
};

// ─── AI ENRICHMENT ──────────────────────────────────────────────────

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
      location_lat:    coords.lat || 0,
      location_lng:    coords.lon || 0,
      status:          'analyzed',
      analyzed_at:     admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Report ${reportId} enriched | Coords: ${coords.lat}, ${coords.lon}`);

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
        isDemo: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    console.log(`✅ ${clusterData.cluster_count} clusters updated`);

    // Auto assign if any cluster is urgent
for (const cluster of clusterData.clusters) {
  await autoAssignIfUrgent(cluster.cluster_id);
}

// Escalate urgency on old unresolved reports
fetch('http://localhost:5000/escalate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reports: reports })
}).then(r => r.json()).then(data => {
  if (data.escalated_count > 0) {
    console.log(`⬆️ ${data.escalated_count} reports escalated`);
  }
}).catch(() => {});

  } catch (err) {
    console.error('❌ PULSE AI failed:', err.message);
  }
}
// ─── WHATSAPP CONVERSATIONAL BOT ────────────────────────────────────

// Check if message has enough info to skip conversation
function isDetailedReport(text) {
  const hasLocation = /abids|hyderabad|mumbai|delhi|chennai|kolkata|bangalore|pune|jaipur|lucknow|village|nagar|pur|abad|puram/i.test(text);
  const hasNumber = /\d+/.test(text);
  const hasNeedType = /paani|water|khaana|food|medical|bimaar|doctor|hospital|khana|pani/i.test(text);

  const wordCount = text.trim().split(/\s+/).length;

  // Smart detection logic
  return (
    (hasLocation && (hasNumber || hasNeedType)) ||   // strong signal
    (wordCount >= 8 && hasNumber && hasNeedType)     // fallback
  );
}

// Get or create conversation state for a sender
async function getConversation(senderNumber) {
  const convRef = db.collection('conversations').doc(senderNumber.replace(/[^a-zA-Z0-9]/g, '_'));
  const doc = await convRef.get();
  if (!doc.exists) return null;
  const data = doc.data();
  // Expire conversations older than 30 minutes
  const age = Date.now() - (data.updated_at?.toMillis() || 0);
  if (age > 30 * 60 * 1000) {
    await convRef.delete();
    return null;
  }
  return { ref: convRef, ...data };
}

// Save conversation state
async function saveConversation(senderNumber, state) {
  const convRef = db.collection('conversations').doc(senderNumber.replace(/[^a-zA-Z0-9]/g, '_'));
  await convRef.set({
    ...state,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Delete conversation
async function deleteConversation(senderNumber) {
  const convRef = db.collection('conversations').doc(senderNumber.replace(/[^a-zA-Z0-9]/g, '_'));
  await convRef.delete();
}

// Main bot handler — returns reply text or null if should process as report
// Detect language using AI
async function detectLanguage(text) {
  try {
    const res = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    return data?.data?.language_detected || 'Hindi';
  } catch {
    return 'Hindi';
  }
}

// Get bot messages in detected language
function getBotMessages(language) {
  const messages = {
    'Telugu': {
      welcome: 'Namaskaram! PULSE lo mee swaagatam. 🙏\n\nEmi samasya?\n*1* - Neellu samasya 💧\n*2* - Tindlu samasya 🍱\n*3* - Vaidya avasaram 🏥',
      invalid_need: 'Dayachesi *1*, *2*, leda *3* matrame pamandi.',
      ask_people: 'Entha mandi prabhavitam ayyaru? Kevalamu number pamandi.\nUdaharana: *50*',
      invalid_number: 'Dayachesi kevalamu number pamandi. Udaharana: *50*',
      ask_days: 'Ee samasya enni roju nundi undi? Number pamandi.\nUdaharana: *3*',
      ask_location: 'Mee location emi? Village leda area peru pamandi.\nUdaharana: *Abids, Hyderabad*',
      confirm: (need, people, days, loc) => `✅ *Report nondinchabadindi!*\n\n💧 *Samasya:* ${need}\n👥 *Prabhavitam:* ${people}\n📅 *Rojulu:* ${days}\n📍 *Location:* ${loc}\n\nVeelaithe volunteer pampadamu. Dhanyavaadalu! 🙏`
    },
    'Tamil': {
      welcome: 'Vanakkam! PULSE-il ungalai varaverkiRom. 🙏\n\nEantha piracchanai?\n*1* - Tanni piracchanai 💧\n*2* - Unavu piracchanai 🍱\n*3* - Maruthuvam 🏥',
      invalid_need: 'Thayavu seithu *1*, *2*, alladu *3* matrum anupungal.',
      ask_people: 'Ethanai peyar pathikkapattanar? Eppadi number anupungal.\nEthugaranam: *50*',
      invalid_number: 'Thayavu seithu oru number matrum anupungal. Ethugaranam: *50*',
      ask_days: 'Ee piracchanai ethanai naatkalaga irukku? Number anupungal.\nEthugaranam: *3*',
      ask_location: 'Ungal idam enna? Kiraamam alladu pகுதி peyar anupungal.\nEthugaranam: *Chennai*',
      confirm: (need, people, days, loc) => `✅ *Arikkai padhivu seyyappattu!*\n\n💧 *Piracchanai:* ${need}\n👥 *Pathikkapattavar:* ${people}\n📅 *Naatkal:* ${days}\n📍 *Idam:* ${loc}\n\nVirai vil thoNdar anupappaduvaar. Nandri! 🙏`
    },
    'Marathi': {
      welcome: 'Namaskar! PULSE madhe aapale swagat ahe. 🙏\n\nKay samasya ahe?\n*1* - Paanyanchi kami 💧\n*2* - Jevanachi kami 🍱\n*3* - Vaidyakiy nadavnu 🏥',
      invalid_need: 'Kripaya fakt *1*, *2*, kiva *3* pathava.',
      ask_people: 'Kiti log prabhavit ahet? Fakat number pathava.\nUdaharana: *50*',
      invalid_number: 'Kripaya fakt number pathava. Udaharana: *50*',
      ask_days: 'Hi samasya kiti divasanpasun ahe? Number pathava.\nUdaharana: *3*',
      ask_location: 'Tumcha location kaay ahe? Gaav kiva bhagacha nav pathava.\nUdaharana: *Pune*',
      confirm: (need, people, days, loc) => `✅ *Ahewal nondavla gela!*\n\n💧 *Samasya:* ${need}\n👥 *Prabhavit:* ${people}\n📅 *Divas:* ${days}\n📍 *Sthaan:* ${loc}\n\nLavkarach volunteer pathavla jail. Dhanyavaad! 🙏`
    },
    'Bengali': {
      welcome: 'Namaskar! PULSE-e apnake swagat. 🙏\n\nKi samasya?\n*1* - Pani samasya 💧\n*2* - Khabar samasya 🍱\n*3* - Chikitsa acche 🏥',
      invalid_need: 'Onugraha kore sudhu *1*, *2*, ba *3* pathaan.',
      ask_people: 'Kotojon prabhavit? Sudhu number pathaan.\nUdaharan: *50*',
      invalid_number: 'Onugraha kore sudhu number pathaan. Udaharan: *50*',
      ask_days: 'Ei samasya koto din dhore? Number pathaan.\nUdaharan: *3*',
      ask_location: 'Apnar location ki? Gram ba elaka naam pathaan.\nUdaharan: *Kolkata*',
      confirm: (need, people, days, loc) => `✅ *Report nথিভুক্ত হয়েছে!*\n\n💧 *Samasya:* ${need}\n👥 *Prabhavit:* ${people}\n📅 *Din:* ${days}\n📍 *Location:* ${loc}\n\nShighroi volunteer pathano hobe. Dhanyabad! 🙏`
    },
    'English': {
      welcome: 'Hello! Welcome to PULSE. 🙏\n\nWhat is the problem?\n*1* - Water shortage 💧\n*2* - Food shortage 🍱\n*3* - Medical emergency 🏥',
      invalid_need: 'Please reply with only *1*, *2*, or *3*.',
      ask_people: 'How many people are affected? Send only a number.\nExample: *50*',
      invalid_number: 'Please send only a number. Example: *50*',
      ask_days: 'How many days has this problem existed? Send a number.\nExample: *3*',
      ask_location: 'What is your location? Send village or area name.\nExample: *Abids, Hyderabad*',
      confirm: (need, people, days, loc) => `✅ *Report registered!*\n\n💧 *Problem:* ${need}\n👥 *Affected:* ${people}\n📅 *Days:* ${days}\n📍 *Location:* ${loc}\n\nA volunteer will be sent soon. Thank you! 🙏`
    },
    'Hindi': {
      welcome: 'Namaste! PULSE mein aapka swagat hai. 🙏\n\nKya samasya hai?\n*1* - Paani ki kami 💧\n*2* - Khaane ki kami 🍱\n*3* - Medical emergency 🏥',
      invalid_need: 'Kripaya sirf *1*, *2*, ya *3* bhejein.',
      ask_people: 'Kitne log affected hain? Sirf number bhejein.\nJaise: *50*',
      invalid_number: 'Kripaya sirf number bhejein. Jaise: *50*',
      ask_days: 'Kitne din se yeh samasya hai? Number bhejein.\nJaise: *3*',
      ask_location: 'Aapka location kya hai? Village ya area ka naam bhejein.\nJaise: *Abids, Hyderabad*',
      confirm: (need, people, days, loc) => `✅ *Report darj ho gayi!*\n\n💧 *Samasya:* ${need}\n👥 *Log affected:* ${people}\n📅 *Din se:* ${days}\n📍 *Location:* ${loc}\n\nJald hi volunteer bheja jayega. Shukriya! 🙏`
    }
  };
  return messages[language] || messages['Hindi'];
}

async function handleBotConversation(senderNumber, incomingText) {
  const text = incomingText.trim();
  const upper = text.toUpperCase();

  const conv = await getConversation(senderNumber);

  // No active conversation
  if (!conv) {
    if (isDetailedReport(text)) return null;

    // Detect language
    const language = await detectLanguage(text);
    const msgs = getBotMessages(language);

    await saveConversation(senderNumber, {
      step: 'ask_need_type',
      sender: senderNumber,
      language
    });

    return msgs.welcome;
  }

  const msgs = getBotMessages(conv.language || 'Hindi');

  // Step 1: Need type
  if (conv.step === 'ask_need_type') {
    const needMap = { '1': 'water', '2': 'food', '3': 'medical' };
    const needType = needMap[text];

    if (!needType) {
      return msgs.invalid_need;
    }

    await saveConversation(senderNumber, {
      step: 'ask_people',
      need_type: needType,
      sender: senderNumber,
      language: conv.language
    });

    return msgs.ask_people;
  }

  // Step 2: People affected
  if (conv.step === 'ask_people') {
    const num = parseInt(text);
    if (isNaN(num) || num <= 0) return msgs.invalid_number;

    await saveConversation(senderNumber, {
      step: 'ask_days',
      need_type: conv.need_type,
      affected_people: num,
      sender: senderNumber,
      language: conv.language
    });

    return msgs.ask_days;
  }

  // Step 3: Days unmet
  if (conv.step === 'ask_days') {
    const days = parseInt(text);
    if (isNaN(days) || days <= 0) return msgs.invalid_number;

    await saveConversation(senderNumber, {
      step: 'ask_location',
      need_type: conv.need_type,
      affected_people: conv.affected_people,
      days_unmet: days,
      sender: senderNumber,
      language: conv.language
    });

    return msgs.ask_location;
  }

  // Step 4: Location — complete report
  if (conv.step === 'ask_location') {
    const location = text;
    const reportText = `${conv.need_type} crisis at ${location}. ${conv.affected_people} people affected for ${conv.days_unmet} days.`;

    await deleteConversation(senderNumber);

    const docRef = await db.collection('reports').add({
      raw_text:        reportText,
      sender:          senderNumber,
      need_type:       conv.need_type,
      urgency_score:   0,
      location_text:   location,
      location_lat:    0,
      location_lng:    0,
      language:        conv.language,
      summary:         '',
      affected_people: conv.affected_people,
      days_unmet:      conv.days_unmet,
      status:          'new',
      source:          'whatsapp_bot',
      timestamp:       admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🤖 Bot report complete [${conv.language}]: ${reportText}`);
    enrichWithPULSEAI(docRef.id, reportText).catch(console.error);

    return msgs.confirm(conv.need_type, conv.affected_people, conv.days_unmet, location);
  }
    // Fallback
  await deleteConversation(senderNumber);
  return null;
}

// ─── ROUTES ─────────────────────────────────────────────────────────

// Test route
app.get('/', (req, res) => {
  res.send('PULSE backend is running!');
});

// Twilio WhatsApp intake
app.post('/incoming-message', async (req, res) => {
  try {
    const incomingText = req.body.Body?.trim();
    const senderNumber = req.body.From;
    const upperText = incomingText?.toUpperCase();

    // Check if this is a volunteer reply first
    if (upperText === 'ACCEPT' || upperText === 'DONE' || upperText === 'DECLINE') {
      console.log(`📱 Volunteer reply from ${senderNumber}: ${upperText}`);

      const volunteerSnapshot = await db.collection('volunteers')
        .where('phone', '==', senderNumber.replace('whatsapp:', ''))
        .get();

      if (!volunteerSnapshot.empty) {
        const volunteerDoc = volunteerSnapshot.docs[0];
        const volunteer = volunteerDoc.data();
        const taskId = volunteer.assigned_task_id;

        if (taskId) {
          if (upperText === 'ACCEPT') {
            await db.collection('tasks').doc(taskId).update({ status: 'accepted' });
            
            // 🔥 GET TASK DATA
            const taskDoc = await db.collection('tasks').doc(taskId).get();
            const task = taskDoc.data();
            const lat = task.location_lat;
            const lng = task.location_lng;
            
            // 🗺️ GOOGLE MAPS LINK
            // Navigation from volunteer's location to crisis location
            const mapsLink = (volunteer.location_lat && volunteer.location_lng)
            ? `https://www.google.com/maps/dir/?api=1&origin=${volunteer.location_lat},${volunteer.location_lng}&destination=${lat},${lng}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

            // Calculate distance (if volunteer coords exist)
            let distanceText = '';
            let etaText = '';
            
            if (volunteer.location_lat && volunteer.location_lng && lat && lng) {
              const distance = calculateDistance(
                volunteer.location_lat, volunteer.location_lng, lat, lng);
              const rounded = Math.round(distance * 10) / 10;
              const eta = Math.round((distance / 40) * 60);
              distanceText = `📏 Distance: ${rounded} km\n`;
              etaText = `⏱️ ETA: ~${eta} mins\n`;
            }
            
            console.log(`✅ ${volunteer.name} accepted task`);
            
            res.set('Content-Type', 'text/xml');
            return res.send(`
              <Response>
              <Message>✅ Task accepted, ${volunteer.name}!
              📍 Crisis location: ${task.location_text}
              ${distanceText}${etaText}🗺️ Navigation: ${mapsLink}
              
              ⚠️ Issue: ${task.need_type}
              👥 People affected: ${task.affected_people || 'Unknown'}
              📝 ${task.summary || task.raw_text || 'Proceed to location immediately'}

              Reply DONE when complete.</Message>
              </Response>
              `);
            }

          if (upperText === 'DONE') {
            await db.collection('tasks').doc(taskId).update({ status: 'done' });
            await db.collection('volunteers').doc(volunteerDoc.id).update({
              available: true,
              assigned_task_id: ''
            });
            console.log(`✅ ${volunteer.name} completed task`);
            res.set('Content-Type', 'text/xml');
            return res.send(`
              <Response>
                <Message>🎉 Thank you! Task marked complete. You are now available for new tasks.</Message>
              </Response>
            `);
          }

          if (upperText === 'DECLINE') {
            await db.collection('tasks').doc(taskId).update({ status: 'declined' });
            await db.collection('volunteers').doc(volunteerDoc.id).update({
              available: true,
              assigned_task_id: ''
            });
            console.log(`⚠️ ${volunteer.name} declined task`);
            res.set('Content-Type', 'text/xml');
            return res.send(`
              <Response>
                <Message>Understood. We will find another volunteer. Thank you.</Message>
              </Response>
            `);
          }
        }
      }
    }

// Check bot conversation first
    const botReply = await handleBotConversation(senderNumber, incomingText);

    if (botReply !== null) {
      // Bot is handling this conversation
      console.log(`🤖 Bot reply to ${senderNumber}`);
      res.set('Content-Type', 'text/xml');
      return res.send(`
        <Response>
          <Message>${botReply}</Message>
        </Response>
      `);
    }

    // Bot said null = detailed report, process directly
    console.log(`📩 Direct report from ${senderNumber}: ${incomingText}`);

    const docRef = await db.collection('reports').add({
      raw_text:      incomingText,
      sender:        senderNumber,
      need_type:     '',
      urgency_score: 0,
      location_text: '',
      location_lat:  0,
      location_lng:  0,
      language:      '',
      summary:       '',
      status:        'new',
      timestamp:     admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Raw report saved!', docRef.id);
    enrichWithPULSEAI(docRef.id, incomingText).catch(console.error);

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

// Volunteer registration — Person C's form posts here
app.post('/register-volunteer', async (req, res) => {
  try {
    const { name, email, skills, location, location_text, location_lat, location_lng, phone } = req.body;

    let lat = location_lat || 0;
    let lng = location_lng || 0;
    let locText = location_text || location || '';

    // If no coordinates provided, geocode the location text
    if (!lat && locText) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locText)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'PULSE-NGO-App' } }
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch (geoErr) {
        console.log('⚠️ Geocoding failed for volunteer location');
      }
    }

    const docRef = await db.collection('volunteers').add({
      name,
      email:            email || '',
      skills:           Array.isArray(skills) ? skills : [skills],
      location_lat:     lat,
      location_lng:     lng,
      location_text:    locText,
      phone:            phone || '',
      available:        true,
      assigned_task_id: '',
      registered_at:    admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Volunteer registered: ${name} | Coords: ${lat}, ${lng} | ID: ${docRef.id}`);
    res.json({ success: true, volunteer_id: docRef.id });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// Match volunteers to a cluster
app.post('/match-volunteers', async (req, res) => {
  try {
    const { cluster_id } = req.body;

    const clusterDoc = await db.collection('clusters').doc(cluster_id).get();
    if (!clusterDoc.exists) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const cluster = clusterDoc.data();
    const requiredSkills = skillMap[cluster.need_type] || [];

    const volunteersSnapshot = await db.collection('volunteers')
      .where('available', '==', true)
      .get();

    if (volunteersSnapshot.empty) {
      return res.json({ matches: [], message: 'No volunteers available' });
    }

    const scored = [];
    volunteersSnapshot.forEach(doc => {
      const v = doc.data();
      const hasSkill = v.skills?.some(s => requiredSkills.includes(s));
      if (!hasSkill) return;

      const distance = calculateDistance(
        cluster.centroid_lat,
        cluster.centroid_lon,
        v.location_lat,
        v.location_lng
      );

      scored.push({
        volunteer_id:  doc.id,
        name:          v.name,
        skills:        v.skills,
        location_text: v.location_text,
        distance_km:   Math.round(distance * 10) / 10
      });
    });

    scored.sort((a, b) => a.distance_km - b.distance_km);
    const top3 = scored.slice(0, 3);

    console.log(`✅ Found ${top3.length} volunteers for cluster ${cluster_id}`);
    res.json({ cluster_id, need_type: cluster.need_type, matches: top3 });

  } catch (error) {
    console.error('❌ Matching error:', error);
    res.status(500).json({ error: 'Matching failed' });
  }
});

// Assign volunteer to cluster — creates a task
app.post('/assign-volunteer', async (req, res) => {
  try {
    const { cluster_id, volunteer_id } = req.body;

    const clusterDoc = await db.collection('clusters').doc(cluster_id).get();
    const volunteerDoc = await db.collection('volunteers').doc(volunteer_id).get();

    if (!clusterDoc.exists || !volunteerDoc.exists) {
      return res.status(404).json({ error: 'Cluster or volunteer not found' });
    }

    const cluster = clusterDoc.data();
    const volunteer = volunteerDoc.data();

    const taskRef = await db.collection('tasks').add({
      cluster_id,
      volunteer_id,
      need_type:      cluster.need_type,
      location_text: bestReport.location_text,
      location_lat: bestReport.location_lat,
      location_lng: bestReport.location_lng,
      report_id: bestReport.id,
      summary: bestReport.summary,
      affected_people: bestReport.affected_people,
      volunteer_name: volunteer.name,
      status:         'assigned',
      timestamp:      admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('volunteers').doc(volunteer_id).update({
      available:        false,
      assigned_task_id: taskRef.id
    });

    console.log(`✅ Task ${taskRef.id} — ${volunteer.name} assigned to cluster ${cluster_id}`);
    res.json({ success: true, task_id: taskRef.id });

  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({ error: 'Assignment failed' });
  }
});

// Task status update — volunteer accepts or completes
app.post('/update-task', async (req, res) => {
  try {
    const { task_id, status } = req.body;  // status: 'accepted' or 'done'

    await db.collection('tasks').doc(task_id).update({ status });

    // If done, mark volunteer available again
    if (status === 'done') {
      const taskDoc = await db.collection('tasks').doc(task_id).get();
      const volunteer_id = taskDoc.data().volunteer_id;
      await db.collection('volunteers').doc(volunteer_id).update({
        available:        true,
        assigned_task_id: ''
      });
      console.log(`✅ Task ${task_id} completed — volunteer freed`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Task update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Auto task creation — fires when cluster urgency crosses 80
async function autoAssignIfUrgent(clusterId) {
  try {
    const clusterDoc = await db.collection('clusters').doc(clusterId).get();
    if (!clusterDoc.exists) return;

    const cluster = clusterDoc.data();

    // Only auto-assign if urgency is 80+ and not already assigned
    if (cluster.combined_urgency < 80) return;
    if (cluster.auto_assigned) return;

    console.log(`🚨 Cluster ${clusterId} urgency ${cluster.combined_urgency} — auto assigning...`);

    // Find best volunteer
    const requiredSkills = skillMap[cluster.need_type] || [];
    const volunteersSnapshot = await db.collection('volunteers')
      .where('available', '==', true)
      .get();

    if (volunteersSnapshot.empty) {
      console.log('⚠️ No volunteers available for auto assignment');
      return;
    }

    // Score volunteers
    const scored = [];
    volunteersSnapshot.forEach(doc => {
      const v = doc.data();
      const hasSkill = v.skills?.some(s => requiredSkills.includes(s));
      if (!hasSkill) return;

      const distance = calculateDistance(
        cluster.centroid_lat,
        cluster.centroid_lon,
        v.location_lat,
        v.location_lng
      );

      scored.push({
        volunteer_id:  doc.id,
        name:          v.name,
        skills:        v.skills,
        location_text: v.location_text,
        phone:         v.phone || null,
        distance_km:   Math.round(distance * 10) / 10
      });
    });

    if (scored.length === 0) {
      console.log('⚠️ No skilled volunteers available');
      return;
    }

    // Pick closest
    scored.sort((a, b) => a.distance_km - b.distance_km);
    const best = scored[0];

    // Get all reports inside this cluster
  const reportIds = cluster.report_ids || [];
  
  if (reportIds.length === 0) {
    console.log('⚠️ No reports in cluster');
    return;
  }
  
  // Pick MOST URGENT report
  let bestReport = null;
  
  for (const reportId of reportIds) {
    const doc = await db.collection('reports').doc(reportId).get();
    if (!doc.exists) continue;
    
    const data = doc.data();
    
    if (!bestReport || data.urgency_score > bestReport.urgency_score) {
      bestReport = { id: doc.id, ...data };
    }
  }
  
  if (!bestReport) return;

    // Create task
    const taskRef = await db.collection('tasks').add({
      report_id: bestReport.id,
      location_text: bestReport.location_text,
      location_lat: bestReport.location_lat,
      location_lng: bestReport.location_lng,
      issue: bestReport.need_type,
      people: bestReport.affected_people,
      details: bestReport.raw_text,
      status: 'assigned',
      assigned_to: best.volunteer_id,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mark volunteer unavailable
    await db.collection('volunteers').doc(best.volunteer_id).update({
      available:        false,
      assigned_task_id: taskRef.id
    });

    // Mark cluster as assigned
    await db.collection('clusters').doc(clusterId).update({
      auto_assigned: true,
      assigned_volunteer_id: best.volunteer_id,
      assigned_task_id: taskRef.id
    });

    console.log(`✅ Auto assigned ${best.name} to cluster ${clusterId}`);

    // Send SMS notification to volunteer
    if (best.phone) {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

// Send WhatsApp notification
const navLink = `https://www.google.com/maps/dir/?api=1&destination=${bestReport.location_lat},${bestReport.location_lng}`;

// distance + ETA
let distanceText = '';
let etaText = '';

if (best.location_lat && best.location_lng) {
  const distance = calculateDistance(
    best.location_lat,
    best.location_lng,
    bestReport.location_lat,
    bestReport.location_lng
  );

  const rounded = Math.round(distance * 10) / 10;
  const eta = Math.round((distance / 40) * 60);

  distanceText = `📏 Distance: ${rounded} km\n`;
  etaText = `⏱️ ETA: ~${eta} mins\n`;
}

await twilio.messages.create({
  body: `🚨 PULSE TASK ASSIGNED
  📍 Location: ${bestReport.location_text}
  ${distanceText}${etaText}
  🗺️ Start Navigation: ${navLink}
  ⚠️ Issue: ${bestReport.need_type}
  👥 People affected: ${bestReport.affected_people}
  📝 Details: ${bestReport.summary || 'No extra details'}
  Reply ACCEPT to confirm.`,
  from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
  to: `whatsapp:${best.phone}`
});

// Send SMS notification
await twilio.messages.create({
  body: `🚨 PULSE TASK ASSIGNED

📍 Location: ${bestReport.location_text}
⚠️ Issue: ${bestReport.need_type}
👥 People affected: ${bestReport.affected_people || 'Unknown'}
📝 ${bestReport.summary || bestReport.raw_text}

Reply ACCEPT to confirm.`,
  from: process.env.TWILIO_REAL_NUMBER,
  to: best.phone
});

      console.log(`📱 SMS sent to ${best.name} at ${best.phone}`);
    } else {
      console.log(`⚠️ No phone number for ${best.name} — skipping SMS`);
    }

  } catch (err) {
    console.error('❌ Auto assign failed:', err.message);
  }

}

// Volunteer replies ACCEPT or DONE via SMS
app.post('/sms-reply', async (req, res) => {
  try {
    const reply = req.body.Body?.trim().toUpperCase();
    const senderPhone = req.body.From;

    console.log(`📱 SMS reply from ${senderPhone}: ${reply}`);

    if (reply === 'ACCEPT' || reply === 'DONE') {
      // Find volunteer by phone number
      const volunteerSnapshot = await db.collection('volunteers')
        .where('phone', '==', senderPhone)
        .get();

      if (volunteerSnapshot.empty) {
        console.log('⚠️ Volunteer not found for phone:', senderPhone);
        return res.send('<Response></Response>');
      }

      const volunteerDoc = volunteerSnapshot.docs[0];
      const volunteer = volunteerDoc.data();
      const taskId = volunteer.assigned_task_id;

      if (!taskId) {
        return res.send('<Response></Response>');
      }

      if (reply === 'ACCEPT') {
        await db.collection('tasks').doc(taskId).update({ status: 'accepted' });
        console.log(`✅ ${volunteer.name} accepted task ${taskId}`);
      }

      if (reply === 'DONE') {
        await db.collection('tasks').doc(taskId).update({ status: 'done' });
        await db.collection('volunteers').doc(volunteerDoc.id).update({
          available:        true,
          assigned_task_id: ''
        });
        console.log(`✅ ${volunteer.name} completed task ${taskId}`);
      }
    }

    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');

  } catch (error) {
    console.error('❌ SMS reply error:', error);
    res.status(500).send('Error');
  }
});
// START CALL
app.post("/start-call", async (req, res) => {
  try {
    await client.calls.create({
      to: process.env.MY_PHONE_NUMBER,        // 👈 YOUR PHONE HERE
      from: process.env.TWILIO_REAL_NUMBER,  // 👈 TWILIO NUMBER
      url: `${process.env.NGROK_URL}/incoming-call`
     });
//  twiml: `
//         <Response>
//           <Redirect>${process.env.NGROK_URL}/incoming-call</Redirect>
//         </Response>
//       `


    console.log("📞 Call triggered!");
    res.send("Call started");
  } catch (err) {
    console.error("❌ Twilio error:", err.message);
    res.status(500).send("Call failed");
  }
});

// ─── IVR ROUTES — MULTILINGUAL ──────────────────────────────────────

app.all('/incoming-call', (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Gather action="${process.env.NGROK_URL}/handle-language" method="POST" numDigits="1" timeout="10">
        <Say language="hi-IN" voice="Polly.Aditi">
          Namaste. PULSE mein aapka swagat hai.
          Hindi ke liye 1 dabaiye.
          Telugu ke liye 2 dabaiye.
          Tamil ke liye 3 dabaiye.
          English ke liye 4 dabaiye.
        </Say>
      </Gather>
      <Redirect>${process.env.NGROK_URL}/incoming-call</Redirect>
    </Response>
  `);
});

app.all('/handle-language', (req, res) => {
  const digit = (req.body && req.body.Digits) || req.query.Digits;
    console.log("Digits (language):", req.body?.Digits);
  if (!digit) {
    return res.send(`
      <Response>
        <Redirect>${process.env.NGROK_URL}/incoming-call</Redirect>
      </Response>
    `);
  }
  const langMap = {
    '1': { code: 'hi-IN', name: 'Hindi' },
    '2': { code: 'te-IN', name: 'Telugu' },
    '3': { code: 'ta-IN', name: 'Tamil' },
    '4': { code: 'en-IN', name: 'English' }
  };
  const lang = langMap[digit] || langMap['1'];

  const menus = {
    'hi-IN': 'Paani ki samasya ke liye 1. Khaane ke liye 2. Medical ke liye 3.',
    'te-IN': 'Neellu samasya ki 1. Tindlu ki 2. Vaidyam ki 3.',
    'ta-IN': 'Tanni piracchanai ku 1. Unavu ku 2. Maruthuvam ku 3.',
    'en-IN': 'Press 1 for water. Press 2 for food. Press 3 for medical.'
  };

  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Gather action="${process.env.NGROK_URL}/handle-keypress?lang=${lang.code}&amp;langname=${lang.name}" method="POST" numDigits="1" timeout="10">
        <Say language="${lang.code}">
          ${menus[lang.code]}
        </Say>
      </Gather>
       <!-- THIS SAVES YOUR CALL FROM DYING -->
      <Redirect>${process.env.NGROK_URL}/handle-language</Redirect>
    </Response>
  `);
});

app.all('/handle-keypress', (req, res) => {
   console.log("Digits (menu):", req.body?.Digits);
  const digit = (req.body && req.body.Digits) || req.query.Digits;
  const lang = req.query.lang || 'hi-IN';
  const langname = req.query.langname || 'Hindi';
  const needMap = { '1': 'water', '2': 'food', '3': 'medical' };
  const needType = needMap[digit] || 'water';

  const confirms = {
    'hi-IN': `Aapne ${needType} chunaa. Beep ke baad boliye. 30 second hain.`,
    'te-IN': `Meeeru ${needType} select chesaaru. Beep taruvata cheppandi. 30 seconds.`,
    'ta-IN': `Neengal ${needType} therinthukondeergal. Beep-ku pin sollungal. 30 seconds.`,
    'en-IN': `You selected ${needType}. Speak after the beep. 30 seconds.`
  };

  console.log(`📞 IVR: ${digit} → ${needType} | ${lang}`);

  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Say language="${lang}">${confirms[lang]}</Say>
      <Record
        action="${process.env.NGROK_URL}/handle-recording?need_type=${needType}&amp;lang=${lang}&amp;langname=${langname}"
        method="POST"
        maxLength="30"
        playBeep="true"
        trim="trim-silence"
      />
    </Response>
  `);
});

app.all('/handle-recording', async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl;
    const callerPhone = req.body.From;
    const needType = req.query.need_type;
    const lang = req.query.lang || 'hi-IN';
    const langname = req.query.langname || 'Hindi';

    console.log(`📞 IVR recording | ${needType} | ${langname} | ${callerPhone}`);

    const docRef = await db.collection('reports').add({
      raw_text:      `IVR call — ${needType} problem reported`,
      sender:        callerPhone,
      need_type:     needType,
      urgency_score: 0,
      location_text: '',
      location_lat:  0,
      location_lng:  0,
      language:      langname,
      summary:       '',
      source:        'ivr',
      recording_url: recordingUrl,
      status:        'new',
      timestamp:     admin.firestore.FieldValue.serverTimestamp()
    });

    enrichWithPULSEAI(docRef.id, `${needType} samasya hai`).catch(console.error);

    const thanks = {
      'hi-IN': 'Shukriya. Aapki report darj ho gayi. Jald madad aayegi.',
      'te-IN': 'Dhanyavaadalu. Mee report nondinchabadindi. Sahaayam vasthundi.',
      'ta-IN': 'Nandri. Ungal arikkai padhivu seyyappattu. Unavu varugiradu.',
      'en-IN': 'Thank you. Your report has been saved. Help is on the way.'
    };

    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Say language="${lang}">${thanks[lang]}</Say>
      </Response>
    `);

  } catch (error) {
    console.error('❌ IVR error:', error);
    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Say>Error occurred. Please try again.</Say></Response>`);
  }
});

// NGO Registration
app.post('/register-ngo', async (req, res) => {
  try {
    const { name, email, password, organization, phone } = req.body;

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Save NGO profile to Firestore
    await db.collection('ngos').doc(userRecord.uid).set({
      name,
      email,
      organization,
      phone:        phone || '',
      role:         'ngo_admin',
      created_at:   admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ NGO registered: ${name} | ${organization}`);
    res.json({ success: true, uid: userRecord.uid });

  } catch (error) {
    console.error('❌ NGO registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NGO Login — returns Firebase token
app.post('/login-ngo', async (req, res) => {
  try {
    const { email } = req.body;

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Create custom token
    const token = await admin.auth().createCustomToken(userRecord.uid);

    console.log(`✅ NGO logged in: ${email}`);
    res.json({ success: true, token, uid: userRecord.uid });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Invalid credentials' });
  }
});

// Verify token — middleware for protected routes
async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Auto escalation — runs every hour
async function runEscalation() {
  try {
    const snapshot = await db.collection('reports')
      .where('status', '==', 'analyzed')
      .where('location_lat', '>', 0)
      .get();

    if (snapshot.empty) return;

    const reports = snapshot.docs.map(doc => ({
      id:            doc.id,
      need_type:     doc.data().need_type,
      urgency_score: doc.data().urgency_score,
      lat:           doc.data().location_lat,
      lon:           doc.data().location_lng,
      affected_people: doc.data().affected_people || 0,
      days_unmet:    doc.data().days_unmet || 0
    }));

    const res = await fetch('http://localhost:5000/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports })
    });

    const data = await res.json();
    if (data.escalated_count > 0) {
      console.log(`⬆️ Hourly escalation: ${data.escalated_count} reports escalated`);

      // Re-run clustering after escalation
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
          isDemo: true,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      await batch.commit();
      console.log(`✅ Clusters updated after escalation`);

      // Auto assign any newly urgent clusters
      for (const cluster of clusterData.clusters) {
        await autoAssignIfUrgent(cluster.cluster_id);
      }
    }
  } catch (err) {
    console.error('❌ Escalation error:', err.message);
  }
}

// Run escalation every hour
setInterval(runEscalation, 60 * 60 * 1000);
console.log('⏰ Hourly escalation scheduler started');

// Analytics — full system stats
app.get('/analytics', async (req, res) => {
  try {
    const [reportsSnap, volunteersSnap, clustersSnap, tasksSnap] = await Promise.all([
      db.collection('reports').get(),
      db.collection('volunteers').get(),
      db.collection('clusters').get(),
      db.collection('tasks').get()
    ]);

    const reports = reportsSnap.docs.map(d => d.data());
    const volunteers = volunteersSnap.docs.map(d => d.data());
    const clusters = clustersSnap.docs.map(d => d.data());
    const tasks = tasksSnap.docs.map(d => d.data());

    const analytics = {
      reports: {
        total:     reports.length,
        analyzed:  reports.filter(r => r.status === 'analyzed').length,
        new:       reports.filter(r => r.status === 'new').length,
        by_type: {
          water:   reports.filter(r => r.need_type === 'water').length,
          food:    reports.filter(r => r.need_type === 'food').length,
          medical: reports.filter(r => r.need_type === 'medical').length
        },
        total_affected: reports.reduce((sum, r) => sum + (r.affected_people || 0), 0)
      },
      volunteers: {
        total:      volunteers.length,
        available:  volunteers.filter(v => v.available).length,
        deployed:   volunteers.filter(v => !v.available).length
      },
      clusters: {
        total:    clusters.length,
        critical: clusters.filter(c => c.combined_urgency >= 80).length,
        high:     clusters.filter(c => c.combined_urgency >= 50 && c.combined_urgency < 80).length,
        medium:   clusters.filter(c => c.combined_urgency < 50).length
      },
      tasks: {
        total:    tasks.length,
        assigned: tasks.filter(t => t.status === 'assigned').length,
        accepted: tasks.filter(t => t.status === 'accepted').length,
        done:     tasks.filter(t => t.status === 'done').length
      }
    };

    res.json({ success: true, analytics });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: 'Analytics failed' });
  }
});


// Generate NGO report for a cluster — proxies to Person A's Flask
app.post('/generate-report', async (req, res) => {
  try {
    const { cluster_id } = req.body;

    const clusterDoc = await db.collection('clusters').doc(cluster_id).get();
    if (!clusterDoc.exists) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const cluster = clusterDoc.data();

    // Get reports in this cluster
    const reportsData = [];
    if (cluster.report_ids && cluster.report_ids.length > 0) {
      for (const reportId of cluster.report_ids) {
        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (reportDoc.exists) reportsData.push(reportDoc.data());
      }
    }

    // Call Person A's report generator
    const flaskRes = await fetch('http://localhost:5000/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster, reports: reportsData })
    });

    const data = await flaskRes.json();
    console.log(`✅ Report generated for cluster ${cluster_id}`);
    res.json(data);

  } catch (error) {
    console.error('❌ Report generation error:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// ─── RANDOM DEMO GENERATOR ─────────────────────────────

const locations = [
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Warangal", lat: 17.9784, lng: 79.5941 },
  { name: "Guntur", lat: 16.3067, lng: 80.4365 },
  { name: "Vizag", lat: 17.6868, lng: 83.2185 },
  { name: "Khammam", lat: 17.2473, lng: 80.1514 }
];

const needTypes = ["water", "food", "medical"];

const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

const textVariations = {
  water: [
    "No drinking water for {days} days in {location}, {people} people affected",
    "Severe water shortage in {location}, {people} people suffering",
    "Village wells dried up in {location}, need urgent water supply"
  ],
  food: [
    "{people} people without food in {location} for {days} days",
    "Food shortage reported in {location}, families starving",
    "No ration supply in {location}, urgent food needed"
  ],
  medical: [
    "Medical emergency in {location}, {people} people need help",
    "No doctors available in {location}, urgent medical support required",
    "Health crisis in {location}, people falling sick"
  ]
};

function generateRandomReport() {
  const type = getRandom(needTypes);
  const loc = getRandom(locations);

  const people = Math.floor(Math.random() * 200) + 20; // 20–220
  const days = Math.floor(Math.random() * 5) + 1;      // 1–5 days
  const urgency = Math.floor(Math.random() * 40) + 60; // 60–100

  let template = getRandom(textVariations[type]);

  const languages = ["Hindi", "English", "Telugu"];
  const language = getRandom(languages);

  const rawText = template
    .replace("{location}", loc.name)
    .replace("{people}", people)
    .replace("{days}", days);

  return {
    raw_text: rawText,
    need_type: type,
    urgency_score: urgency,
    affected_people: people,
    days_unmet: days,
    location_text: loc.name,
    location_lat: loc.lat,
    location_lng: loc.lng,
    status: "analyzed",
    source: "demo",
    isDemo: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Demo trigger — fires full demo sequence automatically
app.post('/demo-trigger', async (req, res) => {
  try {
    console.log('🎬 Random demo starting...');

    const demoReports = Array.from({ length: 5 }, () => generateRandomReport());

    const savedIds = [];

    for (const report of demoReports) {
      const docRef = await db.collection('reports').add(report);
      savedIds.push(docRef.id);

      console.log(`🎬 Random report: ${report.raw_text}`);

      // 🔥 IMPORTANT: still run AI pipeline
      enrichWithPULSEAI(docRef.id, report.raw_text).catch(console.error);

      await new Promise(r => setTimeout(r, 1000)); // small delay
    }

    res.json({
      success: true,
      message: 'Random demo generated',
      report_ids: savedIds
    });

  } catch (error) {
    console.error('❌ Demo error:', error);
    res.status(500).json({ error: 'Demo failed' });
  }
});

app.delete('/clear-demo-data', async (req, res) => {
  try {
    // Delete demo reports
    const reportsSnap = await db.collection('reports')
      .where('isDemo', '==', true)
      .get();

    const batch = db.batch();

    reportsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete demo clusters
    const clustersSnap = await db.collection('clusters')
      .where('isDemo', '==', true)
      .get();

    clustersSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('🧹 Demo data cleared');

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear demo data' });
  }
});

// ─── PREDICTIVE ALERTS ──────────────────────────────────────────────

async function generatePredictiveAlerts() {
  try {
    console.log('🔮 Running predictive alert analysis...');

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();

    // Get all historical reports
    const snapshot = await db.collection('reports')
      .where('status', '==', 'analyzed')
      .get();

    if (snapshot.empty) return;

    // Group reports by region + need_type + month
    const patterns = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.district && !data.location_text) return;
      if (!data.need_type) return;

      const timestamp = data.timestamp?.toDate() || new Date();
      const month = timestamp.getMonth();
      const region = data.district || data.location_text;
      const key = `${region}__${data.need_type}__${month}`;

      if (!patterns[key]) {
        patterns[key] = {
          region,
          need_type: data.need_type,
          month,
          count: 0,
          total_affected: 0
        };
      }
      patterns[key].count++;
      patterns[key].total_affected += data.affected_people || 0;
    });

    // Check if current month+1 matches any historical pattern
    const nextMonth = (currentMonth + 1) % 12;
    const alerts = [];

    for (const key of Object.keys(patterns)) {
      const pattern = patterns[key];

      // If this region+need_type had 2+ reports in the same month historically
      if (pattern.month === nextMonth && pattern.count >= 2) {
        alerts.push({
          region: pattern.region,
          need_type: pattern.need_type,
          predicted_month: new Date(2026, nextMonth, 1).toLocaleString('default', { month: 'long' }),
          historical_count: pattern.count,
          avg_affected: Math.round(pattern.total_affected / pattern.count),
          confidence: pattern.count >= 4 ? 'HIGH' : pattern.count >= 2 ? 'MEDIUM' : 'LOW'
        });
      }
    }

    if (alerts.length === 0) {
      console.log('🔮 No predictive alerts generated');
      return;
    }

    // Save alerts to Firestore
    const batch = db.batch();
    for (const alert of alerts) {
      const ref = db.collection('predictive_alerts').doc(
        `${alert.region}_${alert.need_type}_${alert.predicted_month}`.replace(/[^a-zA-Z0-9]/g, '_')
      );
      batch.set(ref, {
        ...alert,
        status: 'active',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();

    console.log(`🔮 ${alerts.length} predictive alerts generated`);

    // Notify all NGOs via WhatsApp
    if (alerts.length > 0 && process.env.TWILIO_PHONE_NUMBER) {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const alertMsg = alerts.slice(0, 3).map(a =>
        `⚠️ ${a.region}: ${a.need_type} crisis predicted for ${a.predicted_month} (${a.confidence} confidence, ~${a.avg_affected} people)`
      ).join('\n');

      // Send to NGO admin number if configured
      if (process.env.NGO_ADMIN_PHONE) {
        await twilio.messages.create({
          body: `🔮 PULSE Predictive Alert:\n\n${alertMsg}\n\nPre-position volunteers now.`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:${process.env.NGO_ADMIN_PHONE}`
        });
        console.log('📱 Predictive alert sent to NGO admin');
      }
    }

  } catch (err) {
    console.error('❌ Predictive alert error:', err.message);
  }
}

// Run predictive alerts daily at midnight
setInterval(generatePredictiveAlerts, 24 * 60 * 60 * 1000);
// Also run once on startup after 10 seconds
setTimeout(generatePredictiveAlerts, 10000);
console.log('🔮 Predictive alert system started');

// GET endpoint — fetch current predictive alerts
app.get('/predictive-alerts', async (req, res) => {
  try {
    const snapshot = await db.collection('predictive_alerts')
      .where('status', '==', 'active')
      .get();

    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, alerts });

  } catch (error) {
    console.error('❌ Fetch alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// ─── MULTI-NGO DATA ISOLATION ────────────────────────────────────────

// Get NGO ID from request — from token or header
function getNgoId(req) {
  return req.headers['x-ngo-id'] || req.body?.ngo_id || 'default';
}

// NGO-scoped reports
app.get('/ngo-reports', async (req, res) => {
  try {
    const ngoId = getNgoId(req);

    const snapshot = await db.collection('reports')
      .where('ngo_id', '==', ngoId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, reports });

  } catch (error) {
    console.error('❌ NGO reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// NGO-scoped volunteers
app.get('/ngo-volunteers', async (req, res) => {
  try {
    const ngoId = getNgoId(req);

    const snapshot = await db.collection('volunteers')
      .where('ngo_id', '==', ngoId)
      .get();

    const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, volunteers });

  } catch (error) {
    console.error('❌ NGO volunteers error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// NGO-scoped clusters
app.get('/ngo-clusters', async (req, res) => {
  try {
    const ngoId = getNgoId(req);

    const snapshot = await db.collection('clusters')
      .where('ngo_id', '==', ngoId)
      .get();

    const clusters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, clusters });

  } catch (error) {
    console.error('❌ NGO clusters error:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

// NGO-scoped analytics
app.get('/ngo-analytics', async (req, res) => {
  try {
    const ngoId = getNgoId(req);

    const [reportsSnap, volunteersSnap, clustersSnap, tasksSnap] = await Promise.all([
      db.collection('reports').where('ngo_id', '==', ngoId).get(),
      db.collection('volunteers').where('ngo_id', '==', ngoId).get(),
      db.collection('clusters').where('ngo_id', '==', ngoId).get(),
      db.collection('tasks').where('ngo_id', '==', ngoId).get()
    ]);

    const reports = reportsSnap.docs.map(d => d.data());
    const volunteers = volunteersSnap.docs.map(d => d.data());
    const clusters = clustersSnap.docs.map(d => d.data());
    const tasks = tasksSnap.docs.map(d => d.data());

    res.json({
      success: true,
      ngo_id: ngoId,
      analytics: {
        reports: {
          total: reports.length,
          by_type: {
            water:   reports.filter(r => r.need_type === 'water').length,
            food:    reports.filter(r => r.need_type === 'food').length,
            medical: reports.filter(r => r.need_type === 'medical').length
          },
          total_affected: reports.reduce((sum, r) => sum + (r.affected_people || 0), 0)
        },
        volunteers: {
          total:     volunteers.length,
          available: volunteers.filter(v => v.available).length,
          deployed:  volunteers.filter(v => !v.available).length
        },
        clusters: {
          total:    clusters.length,
          critical: clusters.filter(c => c.combined_urgency >= 80).length
        },
        tasks: {
          total: tasks.length,
          done:  tasks.filter(t => t.status === 'done').length
        }
      }
    });

  } catch (error) {
    console.error('❌ NGO analytics error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Update register-volunteer to tag with ngo_id
app.post('/register-volunteer-ngo', async (req, res) => {
  try {
    const { name, email, skills, location, location_text, location_lat, location_lng, phone, ngo_id } = req.body;

    let lat = location_lat || 0;
    let lng = location_lng || 0;
    let locText = location_text || location || '';

    if (!lat && locText) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locText)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'PULSE-NGO-App' } }
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch { console.log('⚠️ Geocoding failed'); }
    }

    const docRef = await db.collection('volunteers').add({
      name,
      email:            email || '',
      skills:           Array.isArray(skills) ? skills : [skills],
      location_lat:     lat,
      location_lng:     lng,
      location_text:    locText,
      phone:            phone || '',
      ngo_id:           ngo_id || 'default',
      available:        true,
      assigned_task_id: '',
      registered_at:    admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Volunteer registered under NGO ${ngo_id}: ${name}`);
    res.json({ success: true, volunteer_id: docRef.id });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── START SERVER ────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});