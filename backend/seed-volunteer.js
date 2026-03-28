const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addTestVolunteer() {
  await db.collection('volunteers').add({
    name: 'Priya Sharma',
    email: 'priya@test.com',
    skills: ['water_distribution', 'vehicle'],
    location_lat: 17.3850,
    location_lng: 78.4867,
    location_text: 'Hyderabad',
    available: true,
    assigned_task_id: ''
  });
  console.log('✅ Test volunteer added!');
  process.exit(0);
}

addTestVolunteer();