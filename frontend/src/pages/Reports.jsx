import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'reports'), where('status', '==', 'analyzed'), orderBy('timestamp', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-400 font-medium tracking-widest text-sm animate-pulse">Loading reports...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
            Live Feed
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Incoming Reports
          </h2>
          <p className="text-gray-500 text-sm">Live field reports from WhatsApp, SMS and IVR</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            {
              label: 'CRITICAL',
              value: reports.filter(r => r.urgency_score >= 80).length,
              border: 'border-red-500/20',
              glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
              bg: 'bg-gradient-to-br from-red-950/60 to-red-900/20',
              text: 'text-red-400',
              dot: 'bg-red-400',
              icon: '🔴'
            },
            {
              label: 'HIGH',
              value: reports.filter(r => r.urgency_score >= 50 && r.urgency_score < 80).length,
              border: 'border-orange-500/20',
              glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
              bg: 'bg-gradient-to-br from-orange-950/60 to-orange-900/20',
              text: 'text-orange-400',
              dot: 'bg-orange-400',
              icon: '🟠'
            },
            {
              label: 'TOTAL REPORTS',
              value: reports.length,
              border: 'border-emerald-500/20',
              glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
              bg: 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/20',
              text: 'text-emerald-400',
              dot: 'bg-emerald-400',
              icon: '⚡'
            },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-6 text-center transition-all duration-300 ${s.glow} hover:scale-[1.02] cursor-default relative overflow-hidden`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} animate-pulse`}></div>
              <p className="text-xs text-gray-500 font-bold tracking-widest mb-3 uppercase">{s.label}</p>
              <p className={`text-5xl font-black ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Reports */}
        {reports.length === 0 ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-6xl mb-5">📭</p>
            <p className="text-gray-300 text-xl font-bold mb-2">No reports yet</p>
            <p className="text-gray-600 text-sm">Reports appear when WhatsApp messages come in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const urgency = report.urgency_score || 0
              const borderColor = urgency >= 80 ? 'border-red-500/30' : urgency >= 50 ? 'border-orange-500/30' : 'border-yellow-500/30'
              const glowColor = urgency >= 80 ? 'hover:shadow-[0_0_25px_rgba(239,68,68,0.12)]' : urgency >= 50 ? 'hover:shadow-[0_0_25px_rgba(249,115,22,0.12)]' : 'hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]'
              const urgencyText = urgency >= 80 ? 'text-red-400' : urgency >= 50 ? 'text-orange-400' : 'text-yellow-400'
              const urgencyBg = urgency >= 80 ? 'from-red-950/40' : urgency >= 50 ? 'from-orange-950/40' : 'from-yellow-950/40'
              const barColor = urgency >= 80 ? '#ef4444' : urgency >= 50 ? '#f97316' : '#eab308'
              const accentDot = urgency >= 80 ? 'bg-red-500' : urgency >= 50 ? 'bg-orange-500' : 'bg-yellow-500'

              return (
                <div
                  key={report.id}
                  className={`bg-gradient-to-r ${urgencyBg} to-gray-900/60 backdrop-blur-sm border ${borderColor} rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300 ${glowColor} group relative overflow-hidden`}
                >
                  {/* left accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl`} style={{ backgroundColor: barColor, opacity: 0.7 }}></div>

                  <div className="flex items-start justify-between pl-3">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-3 flex-wrap items-center">
                        {/* urgency dot */}
                        <span className={`w-2 h-2 rounded-full ${accentDot} animate-pulse`}></span>

                        {report.need_type && (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs px-3 py-1 rounded-full capitalize font-bold tracking-wide">
                            {report.need_type}
                          </span>
                        )}
                        {report.language && (
                          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs px-3 py-1 rounded-full font-medium">
                            {report.language}
                          </span>
                        )}
                        {report.source && (
                          <span className="bg-purple-500/15 text-purple-400 border border-purple-500/25 text-xs px-3 py-1 rounded-full font-medium">
                            {report.source}
                          </span>
                        )}
                      </div>

                      {report.summary && (
                        <p className="text-white/90 text-sm mb-2 leading-relaxed font-semibold group-hover:text-white transition-colors">
                          {report.summary}
                        </p>
                      )}
                      {report.raw_message && (
                        <p className="text-gray-600 text-xs italic">"{report.raw_message}"</p>
                      )}
                      {(report.location_lat && report.location_lng) && (
                        <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                          <span className="text-emerald-500 text-sm">📍</span>
                          <span className="text-emerald-600/70 font-mono">{report.location_lat?.toFixed(4)}, {report.location_lng?.toFixed(4)}</span>
                        </p>
                      )}
                    </div>

                    <div className="ml-6 text-right flex-shrink-0 flex flex-col items-end">
                      <p className={`text-4xl font-black tabular-nums ${urgencyText}`}>{urgency || '?'}</p>
                      <p className="text-gray-600 text-xs mt-1 tracking-widest uppercase">urgency</p>
                      <div className="w-16 bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: urgency + '%', backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default Reports