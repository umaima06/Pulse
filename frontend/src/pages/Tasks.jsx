import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Tasks() {
  const { t } = useTranslation()
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
    if (status === 'accepted')
      return {
        style: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        icon: '⚡',
        border: 'border-blue-500/30',
        glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]',
        accent: '#3b82f6'
      }

    if (status === 'done')
      return {
        style: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        icon: '✅',
        border: 'border-emerald-500/30',
        glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]',
        accent: '#10b981'
      }

    return {
      style: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      icon: '⏳',
      border: 'border-yellow-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]',
      accent: '#eab308'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 font-medium text-sm animate-pulse">
          {t('loading_tasks')}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Live Tracking
          </div>

          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            {t('task_tracker')}
          </h2>

          <p className="text-gray-500 text-sm">
            {t('task_sub')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">

          {[
            { label: t('pending'), value: tasks.filter(t => t.status === 'pending').length },
            { label: t('accepted'), value: tasks.filter(t => t.status === 'accepted').length },
            { label: t('done'), value: tasks.filter(t => t.status === 'done').length },
            { label: t('total'), value: tasks.length }
          ].map(s => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:scale-[1.02] transition-all"
            >
              <p className="text-xs text-gray-400 font-bold mb-2">{s.label}</p>
              <p className="text-4xl font-black text-emerald-400">{s.value}</p>
            </div>
          ))}

        </div>

        {/* Empty state */}
        {tasks.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-300 font-bold text-xl mb-2">
              {t('no_tasks')}
            </p>
            <p className="text-gray-600 text-sm">
              {t('no_tasks_sub')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {tasks.map(task => {
              const cfg = getStatusConfig(task.status)

              return (
                <div
                  key={task.id}
                  className={`bg-gradient-to-r from-gray-900/80 to-gray-800/50 border ${cfg.border} rounded-2xl p-5 flex items-center justify-between hover:scale-[1.01] transition-all ${cfg.glow}`}
                >

                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.style}`}>
                      {cfg.icon}
                    </div>

                    <div>
                      <p className="font-bold">
                        {task.volunteer_name || t('volunteer')}
                      </p>

                      <p className="text-gray-500 text-xs">
                        {t('cluster_label')}: {task.cluster_id}
                      </p>

                      {task.need_type && (
                        <span className="text-emerald-400 text-xs font-bold capitalize">
                          {task.need_type}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${cfg.style}`}>
                    {task.status || t('pending')}
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