import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api'
import { collection, onSnapshot, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

const mapContainerStyle = { width: '100%', height: '100%' }
const center = { lat: 20.5937, lng: 78.9629 }

function Dashboard() {
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

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'clusters'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setClusters(data)
    })
    const unsub2 = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setReports(data.slice(0, 20))
    })
    fetch('http://localhost:3000/predictive-alerts')
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => {})
    return () => { unsub1(); unsub2() }
  }, [])

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
      <div className="flex gap-3 px-4 md:px-6 py-3 bg-gray-800 border-b border-gray-700 overflow-x-auto items-center">
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
        <button onClick={triggerDemo} disabled={demoLoading}
          className="ml-auto flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2">
          {demoLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Firing...
            </>
          ) : '🚀 Fire Demo'}
        </button>
      </div>

      {/* Map + Panels */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
            {clusters.map(cluster => (
              cluster.centroid_lat && cluster.centroid_lon ? (
                <span key={cluster.id}>
                  {cluster.combined_urgency >= 80 && (
                    <Circle
                      center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                      radius={50000}
                      options={{ strokeColor: '#ef4444', strokeOpacity: 0.15, fillColor: '#ef4444', fillOpacity: 0.06 }}
                    />
                  )}
                  <Circle
                    center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                    radius={15000}
                    options={{ strokeColor: getColor(cluster.combined_urgency), fillColor: getColor(cluster.combined_urgency), fillOpacity: 0.6, cursor: 'pointer' }}
                    onClick={() => setSelected(cluster)}
                  />
                </span>
              ) : null
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
                  {report.raw_message && <p className="text-gray-500 text-xs italic mt-1 truncate">"{report.raw_message}"</p>}
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
                  { label: 'LOCATION', value: (selected.centroid_lat?.toFixed(4) || '') + ', ' + (selected.centroid_lon?.toFixed(4) || '') },
                ].map(item => (
                  <div key={item.label} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-medium capitalize text-sm">{item.value}</p>
                  </div>
                ))}
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