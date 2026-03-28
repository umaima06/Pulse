const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  water:   ['water_distribution', 'vehicle', 'logistics'],
  food:    ['food_distribution', 'vehicle', 'logistics'],
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
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    console.log(`✅ ${clusterData.cluster_count} clusters updated`);

    // Auto assign if any cluster is urgent
for (const cluster of clusterData.clusters) {
  await autoAssignIfUrgent(cluster.cluster_id);
}

  } catch (err) {
    console.error('❌ PULSE AI failed:', err.message);
  }
}

// ─── ROUTES ─────────────────────────────────────────────────────────

// Test route
app.get('/', (req, res) => {
  res.send('PULSE backend is running!');
});

// Twilio WhatsApp intake
app.post('/incoming-message', async (req, res) => {
  try {
    const incomingText = req.body.Body;
    const senderNumber = req.body.From;

    console.log(`📩 New message from ${senderNumber}: ${incomingText}`);

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
    const { name, email, skills, location_lat, location_lng, location_text, phone } = req.body;

    const docRef = await db.collection('volunteers').add({
      name,
      email,
      skills,              // array like ['vehicle', 'water_distribution']
      location_lat,
      location_lng,
      location_text,
      phone: phone || '',
      available:        true,
      assigned_task_id: '',
      registered_at:    admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Volunteer registered: ${name} | ID: ${docRef.id}`);
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
      location_text:  cluster.need_type,
      location_lat:   cluster.centroid_lat,
      location_lng:   cluster.centroid_lon,
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

    // Create task
    const taskRef = await db.collection('tasks').add({
      cluster_id:     clusterId,
      volunteer_id:   best.volunteer_id,
      need_type:      cluster.need_type,
      location_text:  cluster.need_type,
      location_lat:   cluster.centroid_lat,
      location_lng:   cluster.centroid_lon,
      volunteer_name: best.name,
      status:         'assigned',
      auto_assigned:  true,
      timestamp:      admin.firestore.FieldValue.serverTimestamp()
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
await twilio.messages.create({
  body: `PULSE ALERT: Urgent ${cluster.need_type} crisis. ${cluster.village_count} villages affected. Urgency: ${cluster.combined_urgency}/100. Reply ACCEPT to confirm.`,
  from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
  to: `whatsapp:${best.phone}`
});

// Send SMS notification
await twilio.messages.create({
  body: `PULSE ALERT: Urgent ${cluster.need_type} crisis. ${cluster.village_count} villages affected. Urgency: ${cluster.combined_urgency}/100. Reply ACCEPT to confirm.`,
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

// ─── IVR ROUTES ─────────────────────────────────────────────────────

// Field worker gives missed call → Twilio calls back → plays this
app.post('/incoming-call', (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Gather action="/handle-keypress" method="POST" numDigits="1" timeout="10">
        <Say language="hi-IN" voice="Polly.Aditi">
          Namaste. PULSE mein aapka swagat hai.
          Paani ki samasya ke liye 1 dabaiye.
          Khaane ki samasya ke liye 2 dabaiye.
          Medical emergency ke liye 3 dabaiye.
        </Say>
      </Gather>
      <Say language="hi-IN">Koi input nahi mila. Phir se call karein.</Say>
    </Response>
  `);
});

// Handle keypress — start recording
app.post('/handle-keypress', (req, res) => {
  const digit = req.body.Digits;
  const needMap = { '1': 'water', '2': 'food', '3': 'medical' };
  const needType = needMap[digit] || 'water';

  console.log(`📞 IVR keypress: ${digit} → ${needType}`);

  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Say language="hi-IN" voice="Polly.Aditi">
        Aapne ${needType} chunaa. Beep ke baad apni samasya batayein. 30 second hai.
      </Say>
      <Record
        action="/handle-recording?need_type=${needType}"
        method="POST"
        maxLength="30"
        playBeep="true"
        trim="trim-silence"
      />
    </Response>
  `);
});

// Handle recording — save to Firestore + send to AI
app.post('/handle-recording', async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl;
    const callerPhone = req.body.From;
    const needType = req.query.need_type;

    console.log(`📞 IVR recording from ${callerPhone} | need: ${needType} | url: ${recordingUrl}`);

    // Save to Firestore
    const docRef = await db.collection('reports').add({
      raw_text:      `IVR call — ${needType} problem reported`,
      sender:        callerPhone,
      need_type:     needType,
      urgency_score: 0,
      location_text: '',
      location_lat:  0,
      location_lng:  0,
      language:      'Hindi',
      summary:       '',
      source:        'ivr',
      recording_url: recordingUrl,
      status:        'new',
      timestamp:     admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ IVR report saved!', docRef.id);

    // Send to AI for analysis
    enrichWithPULSEAI(docRef.id, `${needType} samasya hai, madad chahiye`).catch(console.error);

    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Say language="hi-IN" voice="Polly.Aditi">
          Shukriya. Aapki report darj kar li gayi hai. Jald hi madad bheja jayega.
        </Say>
      </Response>
    `);

  } catch (error) {
    console.error('❌ IVR recording error:', error);
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Say>Kuch galat hua. Phir se try karein.</Say>
      </Response>
    `);
  }
});

// ─── START SERVER ────────────────────────────────────────────────────

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 PULSE backend running on port ${PORT}`);
});