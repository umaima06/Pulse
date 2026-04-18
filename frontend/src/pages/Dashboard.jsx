import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api'
import { collection, onSnapshot, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { doc } from 'firebase/firestore'

const mapContainerStyle = { width: '100%', height: '100%' }
const center = { lat: 20.5937, lng: 78.9629 }
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
const API_BASE = 'http://localhost:3000'; // 🔥 change if deployed

const reassignCluster = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id: id })
    });

    const data = await res.json();
    console.log('Reassign:', data);

    if (!res.ok) throw new Error(data.error || 'Reassign failed');

    alert(`🔄 Reassigned to ${data.reassigned_to || 'new volunteer'}`);
    
  } catch (err) {
    console.error(err);
    alert(`❌ ${err.message}`);
  }
};

const forceAssignCluster = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/force-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id: id })
    });

    const data = await res.json();
    console.log('Force Assign:', data);

    if (!res.ok) throw new Error(data.error || 'Force assign failed');

    alert(`⚡ Force assigned to ${data.forced_to || 'volunteer'}`);
    
  } catch (err) {
    console.error(err);
    alert(`❌ ${err.message}`);
  }
};

const resolveCluster = async (id) => {
  const note = prompt("📝 Enter resolution note (what was done, how it was solved):");

  if (!note) {
    alert("❌ Resolution note is required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/resolve-cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cluster_id: id,
        note: note
      })
    });

    const data = await res.json();
    console.log('Resolve:', data);

    if (!res.ok) throw new Error(data.error || 'Resolve failed');

    alert('✅ Cluster marked as resolved');

  } catch (err) {
    console.error(err);
    alert(`❌ ${err.message}`);
  }
};

function Dashboard() {
  const [showDemo, setShowDemo] = useState(false)
  const [clusters, setClusters] = useState([])
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [showFeed, setShowFeed] = useState(true)
  const [reportText, setReportText] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoSuccess, setDemoSuccess] = useState(false)
  const [alerts, setAlerts] = useState([])
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  })
  const [unclusteredReports, setUnclusteredReports] = useState([])
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    // Listen to clusters live
    const unsub1 = onSnapshot(
      collection(db, 'clusters'),
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.centroid_lat && c.centroid_lon) // only show mapped clusters
          .sort((a, b) => b.combined_urgency - a.combined_urgency) // worst first
        setClusters(data)
      }
    )

    // Listen to analyzed reports, newest first
    const unsub2 = onSnapshot(
      query(
        collection(db, 'reports'),
        where('status', '==', 'analyzed'),
        orderBy('timestamp', 'desc'),
        // remove limit completely
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setReports(data)
      }
    )

    return () => { unsub1(); unsub2() }
  }, [showDemo])

  useEffect(() => {
    const clusteredIds = new Set(
      clusters.flatMap(c => c.report_ids || [])
    )
    
    const unclustered = reports.filter(r => !clusteredIds.has(r.id))
    setUnclusteredReports(unclustered)
  }, [clusters, reports])
  
  useEffect(() => {
  const interval = setInterval(() => {
    forceUpdate(prev => prev + 1);
  }, 60000); // every 1 min

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  if (!selected?.id) return;
  const unsub = onSnapshot(doc(db, "clusters", selected.id), (doc) => {
    setSelected({ id: doc.id, ...doc.data() });
  });

  return () => unsub();
}, [selected?.id]);

  const triggerDemo = async () => {
    setDemoLoading(true)
    setDemoSuccess(false)
    try {
      await fetch('http://localhost:3000/demo-trigger', { method: 'POST' })
      setDemoSuccess(true)
      setTimeout(() => setDemoSuccess(false), 5000)
    } catch {
      alert('Demo trigger failed. Make sure backend is running on port 3000.')
    }
    setDemoLoading(false)
  }

  const clearDemo = async () => {
    try {
      await fetch('http://localhost:3000/clear-demo-data', {
        method: 'DELETE'
      })
      alert('🧹 Demo data cleared!')
    } catch {
      alert('Failed to clear demo data')
    }
  }

  const getColor = (urgency) => {
    if (urgency >= 80) return '#ef4444'
    if (urgency >= 50) return '#f97316'
    return '#eab308'
  }

  const getLabel = (urgency) => {
    if (urgency >= 80) return { text: 'CRITICAL', bg: 'bg-red-600' }
    if (urgency >= 50) return { text: 'HIGH', bg: 'bg-orange-500' }
    return { text: 'MEDIUM', bg: 'bg-yellow-500' }
  }

  const safe = (v) => (v === 0 ? 0 : v ?? "Unknown");

const parseTime = (timestamp) => {
  if (!timestamp) return null;

  // Firestore Timestamp (real safe check)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // fallback formats
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return null;
};
const getTimeAgo = (timestamp) => {
  const time = parseTime(timestamp);
  if (!time) return 'Unknown';

  const diff = (Date.now() - time.getTime()) / 1000;
  const mins = Math.floor(diff / 60);
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) return `${hrs} hr ago`;
  return `${mins} min ago`;
};

const getDelayColor = (timestamp) => {
  const time = parseTime(timestamp);
  if (!time) return 'text-gray-400';

  const hrs = (Date.now() - time.getTime()) / (1000 * 3600);

  if (hrs > 3) return 'text-red-400';     // 🚨 BAD
  if (hrs > 1) return 'text-yellow-400';  // ⚠️ MID
  return 'text-green-400';                // ✅ OK
};
const getDaysUnmet = (created_at) => {
  const time = parseTime(created_at);
  if (!time) return '0 days';

  const days = Math.max(
    0,
    Math.floor((Date.now() - time.getTime()) / (1000 * 3600 * 24))
  );

  return `${days} days`;
};

  const generateReport = async (cluster) => {
    setReportLoading(true)
    setShowReportModal(true)
    setReportText('')
    try {
      const reportsSnap = await getDocs(
        query(collection(db, 'reports'), where('status', '==', 'analyzed'))
      )
      const clusterReports = reportsSnap.docs
        .filter(doc => (cluster.report_ids || []).includes(doc.id))
        .map(doc => doc.data())
      const res = await fetch('http://localhost:5000/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, reports: clusterReports })
      })
      const data = await res.json()
      setReportText(data.report)
    } catch {
      setReportText('Could not generate report. Make sure AI server is running on port 5000.')
    }
    setReportLoading(false)
  }

  if (!isLoaded) return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Navbar />

      {/* Predictive Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-yellow-900 border-b border-yellow-700 px-6 py-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-yellow-400 text-sm font-bold flex-shrink-0">⚠️ PREDICTIVE ALERTS:</span>
          {alerts.slice(0, 3).map((alert, i) => (
            <span key={i} className="text-yellow-200 text-xs bg-yellow-800 px-3 py-1 rounded-full flex-shrink-0">
              {alert.region} — {alert.need_type} ({alert.confidence} confidence)
            </span>
          ))}
        </div>
      )}

      {/* Demo Success Banner */}
      {demoSuccess && (
        <div className="bg-green-800 border-b border-green-600 px-6 py-2 text-center">
          <p className="text-green-300 text-sm font-medium">✅ Demo fired! 3 crisis reports sent — watch the map update live!</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex gap-3 px-4 md:px-6 py-3 bg-gray-800 border-b border-gray-700 shadow-glow overflow-x-auto items-center">
        {[
          { label: 'CRITICAL', value: clusters.filter(c => c.combined_urgency >= 80).length, bg: 'bg-red-900', text: 'text-red-300' },
          { label: 'HIGH', value: clusters.filter(c => c.combined_urgency >= 50 && c.combined_urgency < 80).length, bg: 'bg-orange-900', text: 'text-orange-300' },
          { label: 'MEDIUM', value: clusters.filter(c => c.combined_urgency < 50).length, bg: 'bg-yellow-900', text: 'text-yellow-300' },
          { label: 'CLUSTERS', value: clusters.length, bg: 'bg-gray-700', text: 'text-gray-300' },
          { label: 'REPORTS', value: reports.length, bg: 'bg-blue-900', text: 'text-blue-300' },
        ].map(stat => (
          <div key={stat.label} className={"px-4 py-2 rounded-lg flex-shrink-0 " + stat.bg}>
            <p className={"text-xs " + stat.text}>{stat.label}</p>
            <p className="text-white font-bold text-xl">{stat.value}</p>
          </div>
        ))}

        {/* Demo Trigger Button */}
        <button onClick={() => setShowDemo(!showDemo)}>
        </button>
        
        <button onClick={triggerDemo} disabled={demoLoading}
        className="ml-auto flex-shrink-0 bg-gradient-to-r from-emerald-500 to-green-400 text-white text-sm font-bold px-5 py-2 rounded-lg">
          {demoLoading ? 'Firing...' : '🚀 Fire Demo'}
        </button>
        
        <button onClick={clearDemo}
        className="ml-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-lg">
          🧹 Clear Demo
        </button>
      </div>

      {/* Map + Panels */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 h-full">
            <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
              {clusters.map(cluster => (
                cluster.centroid_lat && cluster.centroid_lon ? (
                <span key={cluster.id}>
                  {cluster.combined_urgency >= 80 && (
                    <Circle
                      center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                      radius={50000}
                      options={{  strokeColor: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, clickable: false, }}
                    />
                  )}
                  <Circle
                    center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                    radius={15000}
                    options={{ strokeColor: getColor(cluster.combined_urgency), fillColor: getColor(cluster.combined_urgency), fillOpacity: 0.75, strokeWeight: 0, cursor: 'pointer' }}
                    onClick={() => setSelected(cluster)}
                  />
                </span>
                ) : null
              ))}
              {unclusteredReports.map(report => (
                report.location_lat && report.location_lng && (
                <Circle
                key={report.id}
                center={{ lat: report.location_lat, lng: report.location_lng }}
                radius={30000}
                options={{
                  strokeColor: '#3b82f6',   // 🔵 BLUE = unclustered
                  fillColor: '#3b82f6',
                  fillOpacity: 0.6,
                  strokeWeight: 0
                }}
                />
              )
              ))}
            </GoogleMap>

          <button onClick={() => setShowFeed(!showFeed)}
            className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm border border-gray-600 hover:bg-gray-700 transition-all">
            {showFeed ? '📋 Hide Feed' : '📋 Show Feed'}
          </button>
        </div>

        {/* Live Feed */}
        {showFeed && !selected && (
          <div className="w-72 md:w-80 bg-gray-800 overflow-y-auto border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-white font-bold">📡 Live Feed</h2>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </div>
            <div className="divide-y divide-gray-700 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No reports yet...</p>
                  <p className="text-gray-600 text-xs mt-1">Press 🚀 Fire Demo to see live data</p>
                </div>
              ) : reports.map(report => (
                <div key={report.id} className="p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400 text-xs capitalize font-medium">{report.need_type || 'Unknown'}</span>
                    <span className={"text-xs font-bold " + (report.urgency_score >= 80 ? 'text-red-400' : report.urgency_score >= 50 ? 'text-orange-400' : 'text-yellow-400')}>
                      {report.urgency_score || '?'}
                    </span>
                  </div>
                  {report.summary && <p className="text-gray-300 text-xs leading-relaxed">{report.summary}</p>}
                  {report.raw_text && <p className="text-gray-500 text-xs italic mt-1 truncate">"{report.raw_text}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster Detail Panel */}
        {selected && (
          <div className="w-72 md:w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Cluster Details</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700">✕</button>
              </div>
              <div className={"inline-block px-3 py-1 rounded-full text-white text-sm font-bold mb-4 " + getLabel(selected.combined_urgency).bg}>
                {getLabel(selected.combined_urgency).text} — {selected.combined_urgency}/100
              </div>
              <div className="space-y-3">
                {[
  { label: 'NEED TYPE', value: selected.need_type || 'Unknown' },
  { label: 'REPORTS IN CLUSTER', value: selected.report_count || 1 },
  { label: 'VILLAGES AFFECTED', value: selected.village_count || 1 },
  {
    label: 'PEOPLE AFFECTED',
    value:
      selected.total_affected != null
        ? `${selected.total_affected.toLocaleString()} people`
        : "Unknown"
  },
  {
    label: 'DAYS UNMET',
    value: getDaysUnmet(
  selected.created_at ??
  selected.timestamp ??
  selected.assigned_at
)
  },
].map(item => (
                  <div key={item.label} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-medium capitalize text-sm">{item.value}</p>
                  </div>
                ))}
                {/* ⏱ RESPONSE TRACKING */}
<div className="space-y-3 mt-3">
  <div className="bg-gray-700 rounded-lg p-3">
    <p className="text-gray-400 text-xs">⏱ REPORTED</p>
    <p className={"text-sm font-bold " + getDelayColor(selected.created_at)}>
      {getTimeAgo(selected.created_at ?? selected.timestamp)}
    </p>
  </div>

<div className="bg-gray-700 rounded-lg p-3">
  <p className="text-gray-400 text-xs">👤 STATUS</p>

  <p className="text-sm font-bold">
    {selected.status === "resolved"
      ? "✅ DONE"
      : selected.assigned_at
        ? "👤 ASSIGNED"
        : "⚠️ NOT ASSIGNED"}
  </p>

  <p className="text-xs mt-1 text-gray-300">
    {selected.status === "resolved"
      ? `Completed ${getTimeAgo(selected.resolved_at)}`
      : selected.assigned_at
        ? `Assigned ${getTimeAgo(selected.assigned_at)}`
        : "Waiting for assignment"}
  </p>
</div>
</div>
                {selected.summary && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">SUMMARY</p>
                    <p className="text-white text-sm leading-relaxed">{selected.summary}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">URGENCY LEVEL</p>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all duration-500"
                    style={{ width: selected.combined_urgency + '%', backgroundColor: getColor(selected.combined_urgency) }} />
                </div>
              </div>
              <button onClick={() => generateReport(selected)}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105">
                📄 Generate AI Report
              </button>
              {/* 🚨 ASSIGNMENT STATUS */}
<div className="bg-gray-700 rounded-lg p-3 mt-3">
  <p className="text-gray-400 text-xs mb-1">👤 ASSIGNED TO</p>

  <p className="text-white font-semibold text-sm">
    {selected.ui_assigned_to || selected.volunteer_name || selected.assigned_volunteer_id || "Not assigned"}
  </p>

<p className={
  "text-xs mt-1 font-bold " +
  (selected.assigned_at
    ? getDelayColor(selected.assigned_at)
    : "text-gray-400")
}>
  {!selected.assigned_at
    ? "⚠️ Not assigned yet"
    : (() => {
        const time = parseTime(selected.assigned_at);
        const hrs = (Date.now() - time.getTime()) / (1000 * 3600);

        if (hrs < 0.5) return `✅ Recently assigned (${getTimeAgo(selected.assigned_at)})`;
        if (hrs < 2) return `⚠️ Awaiting response (${getTimeAgo(selected.assigned_at)})`;
        return `🚨 No response (${getTimeAgo(selected.assigned_at)})`;
      })()
  }
</p>
</div>
              {/* 🚨 NGO ACTION PANEL */}
<div className="mt-4 space-y-2">
  <button
    onClick={() => reassignCluster(selected.id)}
    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg"
  >
    🔄 Reassign
  </button>

  <button
    onClick={() => forceAssignCluster(selected.id)}
    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
  >
    ⚡ Force Assign
  </button>

  <button
    onClick={() => resolveCluster(selected.id)}
    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
  >
    ✅ Mark Resolved
  </button>
</div>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl">📄 AI Generated Report</h2>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              {reportLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Generating report with AI...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-900 rounded-xl p-5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap border border-gray-700">
                    {reportText}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(reportText)}
                    className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-all">
                    📋 Copy to Clipboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard