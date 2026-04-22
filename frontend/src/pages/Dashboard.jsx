import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { collection, onSnapshot, getDocs, query, where, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

const mapContainerStyle = { width: '100%', height: '100%' }
const center = { lat: 20.5937, lng: 78.9629 }
const API_BASE = 'https://pulse-backend-production-cd6d.up.railway.app'

// ─── Urgency helpers ──────────────────────────────────────────────────────────
const getColor = (urgency) => {
  if (urgency >= 80) return '#ef4444'
  if (urgency >= 50) return '#f97316'
  return '#eab308'
}

const getLabel = (urgency) => {
  if (urgency >= 80) return { textKey: 'critical', bg: 'bg-red-600' }
  if (urgency >= 50) return { textKey: 'high',     bg: 'bg-orange-500' }
  return              { textKey: 'medium',          bg: 'bg-yellow-500' }
}

// ─── Icon factories ───────────────────────────────────────────────────────────
const clusterIcon = (urgency, reportCount) => {
  if (!window.google) return null
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: Math.min(14 + (reportCount || 1) * 1.5, 24),
    fillColor: getColor(urgency),
    fillOpacity: 1,
    strokeWeight: 2.5,
    strokeColor: '#ffffff',
  }
}

const unclusteredIcon = () => {
  if (!window.google) return null
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 7,
    fillColor: '#3b82f6',
    fillOpacity: 0.9,
    strokeWeight: 2,
    strokeColor: '#ffffff',
  }
}

// ─── Action functions ─────────────────────────────────────────────────────────
const reassignCluster = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id: id })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Reassign failed')
    alert(`🔄 Reassigned to ${data.reassigned_to || 'new volunteer'}`)
  } catch (err) {
    console.error(err)
    alert(`❌ ${err.message}`)
  }
}

const forceAssignCluster = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/force-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id: id })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Force assign failed')
    alert(`⚡ Force assigned to ${data.forced_to || 'volunteer'}`)
  } catch (err) {
    console.error(err)
    alert(`❌ ${err.message}`)
  }
}

const resolveCluster = async (id) => {
  const note = prompt('📝 Enter resolution note (what was done, how it was solved):')
  if (!note) {
    alert('❌ Resolution note is required')
    return
  }
  try {
    const res = await fetch(`${API_BASE}/resolve-cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cluster_id: id, note })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Resolve failed')
    alert('✅ Cluster marked as resolved')
  } catch (err) {
    console.error(err)
    alert(`❌ ${err.message}`)
  }
}

// ─── Time helpers ─────────────────────────────────────────────────────────────
const parseTime = (timestamp) => {
  if (!timestamp) return null
  if (typeof timestamp.toDate === 'function') return timestamp.toDate()
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000)
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp)
  return null
}

const getTimeAgo = (timestamp) => {
  const time = parseTime(timestamp)
  if (!time) return 'Unknown'
  const diff = (Date.now() - time.getTime()) / 1000
  const mins = Math.floor(diff / 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs} hr ago`
  return `${mins} min ago`
}

const getDelayColor = (timestamp) => {
  const time = parseTime(timestamp)
  if (!time) return 'text-gray-400'
  const hrs = (Date.now() - time.getTime()) / (1000 * 3600)
  if (hrs > 3) return 'text-red-400'
  if (hrs > 1) return 'text-yellow-400'
  return 'text-green-400'
}

const getDaysUnmet = (created_at) => {
  const time = parseTime(created_at)
  if (!time) return '0 days'
  const days = Math.max(0, Math.floor((Date.now() - time.getTime()) / (1000 * 3600 * 24)))
  return `${days} days`
}

// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { t } = useTranslation()

  const [clusters, setClusters]                     = useState([])
  const [reports, setReports]                       = useState([])
  const [unclusteredReports, setUnclusteredReports] = useState([])
  const [selected, setSelected]                     = useState(null)
  const [hoveredReport, setHoveredReport]           = useState(null)
  const [showFeed, setShowFeed]                     = useState(true)
  const [reportText, setReportText]                 = useState('')
  const [showReportModal, setShowReportModal]       = useState(false)
  const [reportLoading, setReportLoading]           = useState(false)
  const [demoLoading, setDemoLoading]               = useState(false)
  const [demoSuccess, setDemoSuccess]               = useState(false)
  const [alerts, setAlerts]                         = useState([])
  const [, forceUpdate]                             = useState(0)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  // ── Firestore listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'clusters'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.centroid_lat && c.centroid_lon)
        .sort((a, b) => b.combined_urgency - a.combined_urgency)
      setClusters(data)
    })

    const unsub2 = onSnapshot(
      query(collection(db, 'reports'), where('status', '==', 'analyzed'), orderBy('timestamp', 'desc')),
      (snap) => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )

    return () => { unsub1(); unsub2() }
  }, [])

  // ── Live listener on selected cluster ─────────────────────────────────────
  useEffect(() => {
    if (!selected?.id) return
    const unsub = onSnapshot(doc(db, 'clusters', selected.id), (d) => {
      setSelected({ id: d.id, ...d.data() })
    })
    return () => unsub()
  }, [selected?.id])

  // ── Derive unclustered reports ─────────────────────────────────────────────
  useEffect(() => {
    const clusteredIds = new Set(clusters.flatMap(c => c.report_ids || []))
    setUnclusteredReports(reports.filter(r => !clusteredIds.has(r.id)))
  }, [clusters, reports])

  // ── Force re-render every 1 min for time-ago displays ─────────────────────
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(prev => prev + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Demo helpers ───────────────────────────────────────────────────────────
  const triggerDemo = async () => {
    setDemoLoading(true)
    setDemoSuccess(false)
    try {
      await fetch(`${API_BASE}/demo-trigger`, { method: 'POST' })
      setDemoSuccess(true)
      setTimeout(() => setDemoSuccess(false), 5000)
    } catch {
      alert('Demo trigger failed. Make sure backend is running on port 3000.')
    }
    setDemoLoading(false)
  }

  const clearDemo = async () => {
    try {
      await fetch(`${API_BASE}/clear-demo-data`, { method: 'DELETE' })
      alert('🧹 Demo data cleared!')
    } catch {
      alert('Failed to clear demo data')
    }
  }

  // ── AI report generation ───────────────────────────────────────────────────
  const generateReport = async (cluster) => {
    setReportLoading(true)
    setShowReportModal(true)
    setReportText('')
    try {
      const reportsSnap = await getDocs(
        query(collection(db, 'reports'), where('status', '==', 'analyzed'))
      )
      const clusterReports = reportsSnap.docs
        .filter(d => (cluster.report_ids || []).includes(d.id))
        .map(d => d.data())
      const res = await fetch('http://localhost:5000/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, reports: clusterReports }),
      })
      const data = await res.json()
      setReportText(data.report)
    } catch {
      setReportText('Could not generate report. Make sure AI server is running on port 5000.')
    }
    setReportLoading(false)
  }

  // ── Loading gate ───────────────────────────────────────────────────────────
  if (!isLoaded) return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Navbar />

      {/* Predictive alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-900 border-b border-yellow-700 px-6 py-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-yellow-400 text-sm font-bold flex-shrink-0">⚠️ {t('predictive_title')}:</span>
          {alerts.slice(0, 3).map((alert, i) => (
            <span key={i} className="text-yellow-200 text-xs bg-yellow-800 px-3 py-1 rounded-full flex-shrink-0">
              {alert.region} — {alert.need_type} ({alert.confidence} confidence)
            </span>
          ))}
        </div>
      )}

      {/* Demo success banner */}
      {demoSuccess && (
        <div className="bg-green-800 border-b border-green-600 px-6 py-2 text-center">
          <p className="text-green-300 text-sm font-medium">
            ✅ Demo fired! 3 crisis reports sent — watch the map update live!
          </p>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex gap-3 px-4 md:px-6 py-3 bg-gray-800 border-b border-gray-700 overflow-x-auto items-center">
        {[
          { labelKey: 'critical',      value: clusters.filter(c => c.combined_urgency >= 80).length,                            bg: 'bg-red-900',    text: 'text-red-300'    },
          { labelKey: 'high',          value: clusters.filter(c => c.combined_urgency >= 50 && c.combined_urgency < 80).length, bg: 'bg-orange-900', text: 'text-orange-300' },
          { labelKey: 'medium',        value: clusters.filter(c => c.combined_urgency < 50).length,                             bg: 'bg-yellow-900', text: 'text-yellow-300' },
          { labelKey: 'cluster_severity', value: clusters.length,                                                               bg: 'bg-gray-700',   text: 'text-gray-300'   },
          { labelKey: 'total_reports', value: reports.length,                                                                   bg: 'bg-blue-900',   text: 'text-blue-300'   },
        ].map(stat => (
          <div key={stat.labelKey} className={`px-4 py-2 rounded-lg flex-shrink-0 ${stat.bg}`}>
            <p className={`text-xs ${stat.text}`}>{t(stat.labelKey).toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{stat.value}</p>
          </div>
        ))}
        <button
          onClick={triggerDemo}
          disabled={demoLoading}
          className="ml-auto flex-shrink-0 bg-gradient-to-r from-emerald-500 to-green-400 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-60"
        >
          {demoLoading ? t('analyzing') : `🚀 ${t('fire_demo')}`}
        </button>
        <button
          onClick={clearDemo}
          className="ml-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-lg"
        >
          🧹 Clear Demo
        </button>
      </div>

      {/* Map + side panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MAP ── */}
        <div className="relative flex-1 h-full">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>

            {/* 🔵 Unclustered report dots */}
            {unclusteredReports.map(report => {
              const lat = report.location_lat ?? report.lat ?? report.latitude
              const lng = report.location_lng ?? report.lng ?? report.longitude
              if (!lat || !lng) return null
              return (
                <Marker
                  key={report.id}
                  position={{ lat, lng }}
                  icon={unclusteredIcon()}
                  zIndex={10}
                  onClick={() => setHoveredReport(hoveredReport?.id === report.id ? null : report)}
                />
              )
            })}

            {/* InfoWindow for clicked unclustered report */}
            {hoveredReport && (() => {
              const lat = hoveredReport.location_lat ?? hoveredReport.lat ?? hoveredReport.latitude
              const lng = hoveredReport.location_lng ?? hoveredReport.lng ?? hoveredReport.longitude
              if (!lat || !lng) return null
              return (
                <InfoWindow
                  position={{ lat, lng }}
                  onCloseClick={() => setHoveredReport(null)}
                >
                  <div style={{ maxWidth: 220, fontFamily: 'sans-serif' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#1e3a5f' }}>
                      {hoveredReport.need_type || t('incoming_reports')}
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        color: hoveredReport.urgency_score >= 80 ? '#dc2626'
                          : hoveredReport.urgency_score >= 50 ? '#ea580c' : '#ca8a04'
                      }}>
                        {t('urgency_label')} {hoveredReport.urgency_score ?? '?'}
                      </span>
                    </p>
                    {hoveredReport.summary && (
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
                        {hoveredReport.summary}
                      </p>
                    )}
                    {hoveredReport.raw_text && (
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                        "{hoveredReport.raw_text.slice(0, 80)}{hoveredReport.raw_text.length > 80 ? '…' : ''}"
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )
            })()}

            {/* 🔴/🟠/🟡 Cluster markers */}
            {clusters.map(cluster => (
              <Marker
                key={cluster.id}
                position={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                icon={clusterIcon(cluster.combined_urgency, cluster.report_count)}
                label={{
                  text: String(cluster.report_count || 1),
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
                zIndex={20 + (cluster.combined_urgency || 0)}
                onClick={() => {
                  setHoveredReport(null)
                  setSelected(cluster)
                  setShowFeed(false)
                }}
              />
            ))}

          </GoogleMap>

          {/* Legend */}
          <div className="absolute bottom-14 left-4 bg-gray-900 bg-opacity-90 text-white px-3 py-2 rounded-lg text-xs border border-gray-600 space-y-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /><span>{t('critical')} cluster</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /><span>{t('high')} cluster</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /><span>{t('medium')} cluster</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /><span>Individual report</span></div>
          </div>

          {/* Toggle feed button */}
          <button
            onClick={() => setShowFeed(f => !f)}
            className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm border border-gray-600 hover:bg-gray-700 transition-all"
          >
            {showFeed ? `📋 ${t('hide_feed')}` : `📋 ${t('show_feed')}`}
          </button>
        </div>

        {/* ── LIVE FEED panel ── */}
        {showFeed && !selected && (
          <div className="w-72 md:w-80 bg-gray-800 overflow-y-auto border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-white font-bold">📡 {t('incoming_reports')}</h2>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="divide-y divide-gray-700 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 text-sm">{t('no_reports')}</p>
                  <p className="text-gray-600 text-xs mt-1">{t('no_reports_sub')}</p>
                </div>
              ) : reports.map(report => (
                <div key={report.id} className="p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400 text-xs capitalize font-medium">{report.need_type || 'Unknown'}</span>
                    <span className={`text-xs font-bold ${report.urgency_score >= 80 ? 'text-red-400' : report.urgency_score >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {report.urgency_score ?? '?'}
                    </span>
                  </div>
                  {report.summary  && <p className="text-gray-300 text-xs leading-relaxed">{report.summary}</p>}
                  {report.raw_text && <p className="text-gray-500 text-xs italic mt-1 truncate">"{report.raw_text}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CLUSTER DETAIL panel ── */}
        {selected && (
          <div className="w-72 md:w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">{t('cluster_details')}</h2>
                <button
                  onClick={() => { setSelected(null); setShowFeed(true) }}
                  className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold mb-4 ${getLabel(selected.combined_urgency).bg}`}>
                {t(getLabel(selected.combined_urgency).textKey).toUpperCase()} — {selected.combined_urgency}/100
              </div>

              <div className="space-y-3">
                {[
                  { label: t('need_type'),      value: selected.need_type || 'Unknown' },
                  { label: t('total_reports'),  value: selected.report_count || 1 },
                  { label: t('volunteers_label'), value: selected.village_count || 1 },
                  { label: t('people_affected'), value: selected.total_affected != null ? `${selected.total_affected.toLocaleString()} people` : 'Unknown' },
                  { label: t('days_unmet'),     value: getDaysUnmet(selected.created_at ?? selected.timestamp ?? selected.assigned_at) },
                ].map(item => (
                  <div key={item.label} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-medium capitalize text-sm">{item.value}</p>
                  </div>
                ))}

                {/* ⏱ Response tracking */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">⏱ {t('reported_label').toUpperCase()}</p>
                  <p className={`text-sm font-bold ${getDelayColor(selected.created_at)}`}>
                    {getTimeAgo(selected.created_at ?? selected.timestamp)}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">👤 {t('volunteer_status').toUpperCase()}</p>
                  <p className="text-sm font-bold">
                    {selected.status === 'resolved'
                      ? `✅ ${t('done')}`
                      : selected.assigned_at
                        ? `👤 ${t('assigned')}`
                        : `⚠️ ${t('pending')}`}
                  </p>
                  <p className="text-xs mt-1 text-gray-300">
                    {selected.status === 'resolved'
                      ? `Completed ${getTimeAgo(selected.resolved_at)}`
                      : selected.assigned_at
                        ? `${t('assigned')} ${getTimeAgo(selected.assigned_at)}`
                        : 'Waiting for assignment'}
                  </p>
                </div>

                {selected.summary && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">{t('summary_label').toUpperCase()}</p>
                    <p className="text-white text-sm leading-relaxed">{selected.summary}</p>
                  </div>
                )}
              </div>

              {selected.resolution_note && (
                <div className="bg-green-900 rounded-lg p-3 mt-2">
                  <p className="text-green-300 text-xs mb-1">📝 {t('resolution_note').toUpperCase()}</p>
                  <p className="text-white text-sm">{selected.resolution_note}</p>
                </div>
              )}

              {/* Urgency bar */}
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">{t('urgency').toUpperCase()}</p>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${selected.combined_urgency}%`, backgroundColor: getColor(selected.combined_urgency) }}
                  />
                </div>
              </div>

              {/* AI Report button */}
              <button
                onClick={() => generateReport(selected)}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105"
              >
                📄 {t('generate_report')}
              </button>

              {/* Assignment status */}
              <div className="bg-gray-700 rounded-lg p-3 mt-3">
                <p className="text-gray-400 text-xs mb-1">👤 {t('assigned_to').toUpperCase()}</p>
                <p className="text-white font-semibold text-sm">
                  {selected.ui_assigned_to || selected.volunteer_name || selected.assigned_volunteer_id || 'Not assigned'}
                </p>
                <p className={`text-xs mt-1 font-bold ${selected.assigned_at ? getDelayColor(selected.assigned_at) : 'text-gray-400'}`}>
                  {!selected.assigned_at
                    ? `⚠️ ${t('pending')}`
                    : (() => {
                        const time = parseTime(selected.assigned_at)
                        const hrs = (Date.now() - time.getTime()) / (1000 * 3600)
                        if (hrs < 0.5) return `✅ ${t('recently_assigned')} (${getTimeAgo(selected.assigned_at)})`
                        if (hrs < 2)   return `⚠️ ${t('awaiting_response')} (${getTimeAgo(selected.assigned_at)})`
                        return             `🚨 ${t('no_response')} (${getTimeAgo(selected.assigned_at)})`
                      })()
                  }
                </p>
              </div>

              {/* NGO Action Panel */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => reassignCluster(selected.id)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg"
                >
                  🔄 {t('reassign')}
                </button>
                <button
                  onClick={() => forceAssignCluster(selected.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
                >
                  ⚡ {t('force_assign')}
                </button>
                <button
                  onClick={() => resolveCluster(selected.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                >
                  ✅ {t('mark_resolved')}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── AI Report modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl">📄 {t('generate_report')}</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              {reportLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">{t('analyzing')}</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-900 rounded-xl p-5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap border border-gray-700">
                    {reportText}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(reportText)}
                    className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-all"
                  >
                    📋 {t('copy_clipboard')}
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
