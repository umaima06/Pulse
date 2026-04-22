import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Reports() {
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'analyzed'),
      orderBy('timestamp', 'desc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 text-sm font-medium animate-pulse">{t('loading_reports')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            {t('live_feed')}
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            {t('incoming_reports')}
          </h2>
          <p className="text-gray-500 text-sm">{t('incoming_sub')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: t('critical'), value: reports.filter(r => r.urgency_score >= 80).length },
            { label: t('high'),     value: reports.filter(r => r.urgency_score >= 50 && r.urgency_score < 80).length },
            { label: t('total'),    value: reports.length }
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:scale-[1.02] transition-all">
              <p className="text-xs text-gray-400 font-bold mb-2">{s.label}</p>
              <p className="text-4xl font-black text-emerald-400">{s.value}</p>
            </div>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-300 text-xl font-bold mb-2">{t('no_reports')}</p>
            <p className="text-gray-600 text-sm">{t('no_reports_sub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const urgency = report.urgency_score || 0
              const border = urgency >= 80 ? 'border-red-500/30' : urgency >= 50 ? 'border-orange-500/30' : 'border-yellow-500/30'
              const glow   = urgency >= 80 ? 'hover:shadow-[0_0_25px_rgba(239,68,68,0.12)]' : urgency >= 50 ? 'hover:shadow-[0_0_25px_rgba(249,115,22,0.12)]' : 'hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]'
              const bar    = urgency >= 80 ? '#ef4444' : urgency >= 50 ? '#f97316' : '#eab308'

              return (
                <div key={report.id} className={`bg-gradient-to-r from-gray-900/70 to-gray-800/40 border ${border} rounded-2xl p-5 hover:scale-[1.01] transition-all ${glow}`}>
                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    {report.need_type && (
                      <span className="bg-emerald-500/15 text-emerald-400 text-xs px-3 py-1 rounded-full capitalize border border-emerald-500/20">
                        {report.need_type}
                      </span>
                    )}
                    {report.language && (
                      <span className="bg-blue-500/15 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/20">
                        {report.language}
                      </span>
                    )}
                  </div>
                  <p className="text-white font-semibold text-sm mb-2">{report.summary}</p>
                  <p className="text-gray-600 text-xs italic mb-3">"{report.raw_message}"</p>
                  <div className="flex justify-between items-center">
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mr-4">
                      <div className="h-1.5 rounded-full" style={{ width: urgency + '%', backgroundColor: bar }} />
                    </div>
                    <span className="text-2xl font-black text-emerald-400">{urgency}</span>
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
