import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/analytics')
      .then(r => r.json())
      .then(data => { setAnalytics(data.analytics); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-400 font-medium tracking-widest text-sm animate-pulse">Loading analytics...</p>
    </div>
  )

  if (!analytics) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 text-center">
        <p className="text-6xl mb-5">⚠️</p>
        <p className="text-gray-300 text-xl font-bold mb-2">Backend not running</p>
        <p className="text-gray-600 text-sm">Start backend on port 3000</p>
      </div>
    </div>
  )

  const BarStat = ({ label, value, max, color }) => (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-white font-bold text-sm tabular-nums">{value ?? 0}</span>
      </div>
      <div className="w-full bg-gray-800/80 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: max > 0 ? ((value / max) * 100) + '%' : '0%', boxShadow: '0 0 6px currentColor' }} />
      </div>
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
            Live Analytics
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Analytics
          </h2>
          <p className="text-gray-500 text-sm">Full system overview — live from Firestore</p>
        </div>

        {/* Impact Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 to-green-950/50 border border-emerald-500/20 rounded-2xl p-10 text-center mb-10 relative overflow-hidden hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-300">
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
          <p className="text-7xl font-black text-emerald-400 mb-3 relative z-10">
            {((analytics?.reports?.total_affected ?? 0)).toLocaleString()}+
          </p>
          <p className="text-gray-300 text-xl font-semibold relative z-10">People reached by PULSE</p>
          <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-emerald-500 text-xs tracking-widest uppercase font-semibold">Updated in real time</span>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
          {[
            { label: 'Total Reports', value: analytics?.reports?.total ?? 0, sub: (analytics?.reports?.analyzed ?? 0) + ' analyzed', bg: 'bg-gradient-to-br from-blue-950/60 to-blue-900/20', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            { label: 'People Affected', value: analytics?.reports?.total_affected ?? 0, sub: 'across all clusters', bg: 'bg-gradient-to-br from-red-950/60 to-red-900/20', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
            { label: 'Volunteers', value: analytics?.volunteers?.total ?? 0, sub: (analytics?.volunteers?.available ?? 0) + ' available', bg: 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/20', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
            { label: 'Tasks Done', value: analytics?.tasks?.done ?? 0, sub: 'of ' + (analytics?.tasks?.total ?? 0) + ' total', bg: 'bg-gradient-to-br from-purple-950/60 to-purple-900/20', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 relative overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-default`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} animate-pulse`}></div>
              <p className="text-xs text-gray-500 font-bold tracking-widest mb-2 uppercase">{s.label}</p>
              <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-600 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            { title: '📊 Reports by Type', bars: [
              { label: '💧 Water', value: analytics?.reports?.by_type?.water ?? 0, max: analytics?.reports?.total, color: 'bg-blue-500' },
              { label: '🍱 Food', value: analytics?.reports?.by_type?.food ?? 0, max: analytics?.reports?.total, color: 'bg-orange-500' },
              { label: '🏥 Medical', value: analytics?.reports?.by_type?.medical ?? 0, max: analytics?.reports?.total, color: 'bg-red-500' },
            ]},
            { title: '🗺️ Cluster Severity', bars: [
              { label: '🔴 Critical (80+)', value: analytics?.clusters?.critical ?? 0, max: analytics?.clusters?.total, color: 'bg-red-500' },
              { label: '🟠 High (50-79)', value: analytics?.clusters?.high ?? 0, max: analytics?.clusters?.total, color: 'bg-orange-500' },
              { label: '🟡 Medium (<50)', value: analytics?.clusters?.medium ?? 0, max: analytics?.clusters?.total, color: 'bg-yellow-500' },
            ]},
            { title: '👥 Volunteer Status', bars: [
              { label: '✅ Available', value: analytics?.volunteers?.available ?? 0, max: analytics?.volunteers?.total, color: 'bg-emerald-500' },
              { label: '🚀 Deployed', value: analytics?.volunteers?.deployed ?? 0, max: analytics?.volunteers?.total, color: 'bg-blue-500' },
            ]},
            { title: '✅ Task Status', bars: [
              { label: '📋 Assigned', value: analytics?.tasks?.assigned ?? 0, max: analytics?.tasks?.total, color: 'bg-yellow-500' },
              { label: '⚡ Accepted', value: analytics?.tasks?.accepted ?? 0, max: analytics?.tasks?.total, color: 'bg-blue-500' },
              { label: '🎉 Done', value: analytics?.tasks?.done ?? 0, max: analytics?.tasks?.total, color: 'bg-emerald-500' },
            ]},
          ].map(section => (
            <div key={section.title} className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.08)] transition-all duration-300">
              <h3 className="text-white font-bold text-base mb-6 tracking-wide">{section.title}</h3>
              {section.bars.map(bar => <BarStat key={bar.label} {...bar} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Analytics