import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const getStatusConfig = (status) => {
    if (status === 'accepted') return { style: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: '⚡', dot: 'bg-blue-400', glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]', border: 'border-blue-500/30', accent: '#3b82f6' }
    if (status === 'done') return { style: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: '✅', dot: 'bg-emerald-400', glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]', border: 'border-emerald-500/30', accent: '#10b981' }
    return { style: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: '⏳', dot: 'bg-yellow-400', glow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]', border: 'border-yellow-500/30', accent: '#eab308' }
  }

  if (loading) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-400 font-medium tracking-widest text-sm animate-pulse">Loading tasks...</p>
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
            Live Tracking
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Task Tracker
          </h2>
          <p className="text-gray-500 text-sm">Live volunteer assignments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'PENDING', value: tasks.filter(t => t.status === 'pending').length, bg: 'bg-gradient-to-br from-yellow-950/60 to-yellow-900/20', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]' },
            { label: 'ACCEPTED', value: tasks.filter(t => t.status === 'accepted').length, bg: 'bg-gradient-to-br from-blue-950/60 to-blue-900/20', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400', glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]' },
            { label: 'DONE', value: tasks.filter(t => t.status === 'done').length, bg: 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/20', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]' },
            { label: 'TOTAL', value: tasks.length, bg: 'bg-gradient-to-br from-gray-900/80 to-gray-800/40', border: 'border-white/10', text: 'text-white', dot: 'bg-gray-400', glow: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-6 text-center transition-all duration-300 ${s.glow} hover:scale-[1.02] cursor-default relative overflow-hidden`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} animate-pulse`}></div>
              <p className="text-xs text-gray-500 font-bold tracking-widest mb-3 uppercase">{s.label}</p>
              <p className={`text-5xl font-black ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-6xl mb-5">📋</p>
            <p className="text-gray-300 text-xl font-bold mb-2">No tasks yet</p>
            <p className="text-gray-600 text-sm">Tasks appear when volunteers are auto-assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const cfg = getStatusConfig(task.status)
              return (
                <div key={task.id} className={`bg-gradient-to-r from-gray-900/80 to-gray-800/50 backdrop-blur-sm border ${cfg.border} rounded-2xl p-5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 ${cfg.glow} relative overflow-hidden group`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-70" style={{ backgroundColor: cfg.accent }}></div>
                  <div className="flex items-center gap-4 pl-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${cfg.style} flex-shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold group-hover:text-emerald-50 transition-colors">{task.volunteer_name || 'Volunteer'}</p>
                      <p className="text-gray-500 text-xs font-mono mt-0.5">Cluster: {task.cluster_id}</p>
                      {task.need_type && (
                        <span className="inline-block mt-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs px-2 py-0.5 rounded-full capitalize font-bold tracking-wide">
                          {task.need_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${cfg.style}`}>
                    {task.status || 'pending'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tasks