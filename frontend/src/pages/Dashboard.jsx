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
    return () => { unsub1(); unsub2() }
  }, [])

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
      setReportText('Could not generate report. Make sure the AI server is running on port 5000.')
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

      {/* Stats Bar */}
      <div className="flex gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        <div className="bg-red-900 px-4 py-2 rounded-lg flex-shrink-0">
          <p className="text-red-300 text-xs">CRITICAL</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency >= 80).length}</p>
        </div>
        <div className="bg-orange-900 px-4 py-2 rounded-lg flex-shrink-0">
          <p className="text-orange-300 text-xs">HIGH</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency >= 50 && c.combined_urgency < 80).length}</p>
        </div>
        <div className="bg-yellow-900 px-4 py-2 rounded-lg flex-shrink-0">
          <p className="text-yellow-300 text-xs">MEDIUM</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency < 50).length}</p>
        </div>
        <div className="bg-gray-700 px-4 py-2 rounded-lg flex-shrink-0">
          <p className="text-gray-300 text-xs">TOTAL CLUSTERS</p>
          <p className="text-white font-bold text-xl">{clusters.length}</p>
        </div>
        <div className="bg-blue-900 px-4 py-2 rounded-lg flex-shrink-0">
          <p className="text-blue-300 text-xs">TOTAL REPORTS</p>
          <p className="text-white font-bold text-xl">{reports.length}</p>
        </div>
      </div>

      {/* Map + Panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
            {clusters.map(cluster => (
              cluster.centroid_lat && cluster.centroid_lon ? (
                <span key={cluster.id}>
                  {cluster.combined_urgency >= 80 && (
                    <Circle
                      center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                      radius={40000}
                      options={{ strokeColor: '#ef4444', strokeOpacity: 0.1, fillColor: '#ef4444', fillOpacity: 0.08 }}
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
          <button
            onClick={() => setShowFeed(!showFeed)}
            className="absolute bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm border border-gray-600 hover:bg-gray-700"
          >
            {showFeed ? '📋 Hide Feed' : '📋 Show Feed'}
          </button>
        </div>

        {/* Live Feed */}
        {showFeed && !selected && (
          <div className="w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-white font-bold">📡 Live Feed</h2>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </div>
            <div className="divide-y divide-gray-700">
              {reports.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">No reports yet...</p>
              ) : reports.map(report => (
                <div key={report.id} className="p-4 hover:bg-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400 text-xs capitalize font-medium">{report.need_type || 'Unknown'}</span>
                    <span className={`text-xs font-bold ${report.urgency_score >= 80 ? 'text-red-400' : report.urgency_score >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {report.urgency_score || '?'}
                    </span>
                  </div>
                  {report.summary && <p className="text-gray-300 text-xs">{report.summary}</p>}
                  {report.raw_message && <p className="text-gray-500 text-xs italic mt-1">"{report.raw_message?.slice(0, 60)}..."</p>}
                  {report.location_lat && <p className="text-gray-600 text-xs mt-1">📍 {report.location_lat?.toFixed(3)}, {report.location_lng?.toFixed(3)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster Detail Panel */}
        {selected && (
          <div className="w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Cluster Details</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold mb-4 ${getLabel(selected.combined_urgency).bg}`}>
                {getLabel(selected.combined_urgency).text} — {selected.combined_urgency}/100
              </div>
              <div className="space-y-3">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">NEED TYPE</p>
                  <p className="text-white font-medium capitalize">{selected.need_type || 'Unknown'}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">REPORTS IN CLUSTER</p>
                  <p className="text-white font-medium">{selected.report_count || 1}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">LOCATION</p>
                  <p className="text-white font-medium text-sm">{selected.centroid_lat?.toFixed(4)}, {selected.centroid_lon?.toFixed(4)}</p>
                </div>
                {selected.summary && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">SUMMARY</p>
                    <p className="text-white text-sm">{selected.summary}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">URGENCY LEVEL</p>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${selected.combined_urgency}%`, backgroundColor: getColor(selected.combined_urgency) }} />
                </div>
              </div>

              {/* Generate Report Button */}
              <button
                onClick={() => generateReport(selected)}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                📄 Generate AI Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl">📄 AI Generated Report</h2>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>
              {reportLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Generating report with AI...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-900 rounded-lg p-5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {reportText}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(reportText)}
                    className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
                  >
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