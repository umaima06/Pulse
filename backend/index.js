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
            console.log(`✅ ${volunteer.name} accepted task`);
            res.set('Content-Type', 'text/xml');
            return res.send(`
              <Response>
                <Message>✅ Task accepted! Please proceed to the location. Reply DONE when complete.</Message>
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

    // Otherwise treat as a field report
    console.log(`📩 New report from ${senderNumber}: ${incomingText}`);

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

// Demo trigger — fires full demo sequence automatically
app.post('/demo-trigger', async (req, res) => {
  try {
    console.log('🎬 Demo sequence starting...');

    const demoReports = [
      { text: 'Paani nahi hai Abids mein, 3 din se, 50 log affected', sender: 'whatsapp:+919000000001' },
      { text: 'Medical emergency in Tolichowki, bujurg aadmi behosh hai, doctor chahiye', sender: 'whatsapp:+919000000002' },
      { text: 'Khaane ki kami hai Mehdipatnam area mein, 30 families hain', sender: 'whatsapp:+919000000003' }
    ];

    const savedIds = [];

    for (const report of demoReports) {
      const docRef = await db.collection('reports').add({
        raw_text:      report.text,
        sender:        report.sender,
        need_type:     '',
        urgency_score: 0,
        location_text: '',
        location_lat:  0,
        location_lng:  0,
        language:      '',
        summary:       '',
        status:        'new',
        source:        'demo',
        timestamp:     admin.firestore.FieldValue.serverTimestamp()
      });
      savedIds.push(docRef.id);
      console.log(`🎬 Demo report saved: ${docRef.id}`);

      // Enrich each report
      enrichWithPULSEAI(docRef.id, report.text).catch(console.error);

      // Small delay between reports
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json({
      success: true,
      message: 'Demo sequence fired',
      report_ids: savedIds
    });

  } catch (error) {
    console.error('❌ Demo trigger error:', error);
    res.status(500).json({ error: 'Demo trigger failed' });
  }
});

// ─── START SERVER ────────────────────────────────────────────────────

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 PULSE backend running on port ${PORT}`);
});