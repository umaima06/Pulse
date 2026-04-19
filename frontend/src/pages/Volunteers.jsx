import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Volunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-400 font-medium tracking-widest text-sm animate-pulse">Loading volunteers...</p>
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
            Volunteer Network
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Volunteers
          </h2>
          <p className="text-gray-500 text-sm">All registered volunteers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'AVAILABLE', value: volunteers.filter(v => v.available !== false).length, bg: 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/20', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]' },
            { label: 'BUSY', value: volunteers.filter(v => v.available === false).length, bg: 'bg-gradient-to-br from-red-950/60 to-red-900/20', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400', glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]' },
            { label: 'TOTAL', value: volunteers.length, bg: 'bg-gradient-to-br from-gray-900/80 to-gray-800/40', border: 'border-white/10', text: 'text-white', dot: 'bg-gray-400', glow: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-6 text-center transition-all duration-300 ${s.glow} hover:scale-[1.02] cursor-default relative overflow-hidden`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} animate-pulse`}></div>
              <p className="text-xs text-gray-500 font-bold tracking-widest mb-3 uppercase">{s.label}</p>
              <p className={`text-5xl font-black ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {volunteers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-6xl mb-5">👥</p>
            <p className="text-gray-300 text-xl font-bold mb-2">No volunteers yet</p>
            <p className="text-gray-600 text-sm">Register from the Volunteer page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {volunteers.map(vol => {
              const isAvailable = vol.available !== false
              return (
                <div key={vol.id} className={`bg-gradient-to-r from-gray-900/80 to-gray-800/50 backdrop-blur-sm border ${isAvailable ? 'border-emerald-500/20' : 'border-red-500/20'} rounded-2xl p-6 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 ${isAvailable ? 'hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]' : 'hover:shadow-[0_0_25px_rgba(239,68,68,0.1)]'} relative overflow-hidden group`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-70" style={{ backgroundColor: isAvailable ? '#10b981' : '#ef4444' }}></div>
                  <div className="flex items-center gap-4 pl-3">
                    <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/25 flex items-center justify-center text-xl font-black text-emerald-400 w-12 h-12 flex-shrink-0">
                      {vol.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg group-hover:text-emerald-50 transition-colors">{vol.name}</p>
                      {vol.organization && <p className="text-emerald-400 text-xs font-semibold tracking-wide">{vol.organization}</p>}
                      <p className="text-gray-500 text-sm mt-0.5">📍 {vol.location} · 📱 {vol.phone}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(vol.skills || []).map(skill => (
                          <span key={skill} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs px-2 py-0.5 rounded-full capitalize font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex-shrink-0 ${isAvailable ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
                    {isAvailable ? '🟢 Available' : '🔴 Busy'}
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

export default Volunteers