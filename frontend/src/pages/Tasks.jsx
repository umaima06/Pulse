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
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
      setTasks(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const getStatusStyle = (status) => {
    if (status === 'done')     return 'bg-green-700 text-green-200'
    if (status === 'accepted') return 'bg-blue-700 text-blue-200'
    if (status === 'declined') return 'bg-red-700 text-red-200'
    return 'bg-yellow-700 text-yellow-200'
  }

  const getStatusConfig = (status) => {
    if (status === 'accepted') return {
      style: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      icon: '⚡', border: 'border-blue-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]'
    }
    if (status === 'done') return {
      style: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: '✅', border: 'border-emerald-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]'
    }
    return {
      style: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      icon: '⏳', border: 'border-yellow-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]'
    }
  }

  const getVerificationBadge = (task) => {
    if (task.status !== 'done') return null
    return (
      <div className="mt-3 p-3 rounded-lg bg-green-900 border border-green-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-green-300 text-sm font-bold">{t('verified_proof')}</span>
          <span className="text-green-500 text-xs">{Math.round((task.proof_confidence || 0) * 100)}%</span>
        </div>
        {task.proof_reason && <p className="text-green-200 text-xs">{task.proof_reason}</p>}
        {task.proof_activity && (
          <p className="text-green-600 text-xs mt-1">{t('detected')} {task.proof_activity}</p>
        )}
        {task.proof_image_url && (
          <a href={task.proof_image_url} target="_blank" rel="noreferrer"
            className="text-green-400 text-xs hover:text-green-300 mt-1 block">
            {t('view_proof')}
          </a>
        )}
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-400 text-sm animate-pulse">{t('loading_tasks')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <h2 className="text-3xl font-bold mb-2">{t('task_tracker')}</h2>
        <p className="text-gray-400 mb-8">{t('task_sub')}</p>

        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { label: t('assigned'),      count: tasks.filter(t => t.status === 'assigned').length },
            { label: t('accepted'),      count: tasks.filter(t => t.status === 'accepted').length },
            { label: t('awaiting_proof'),count: tasks.filter(t => t.status === 'awaiting_proof').length },
            { label: t('verified'),      count: tasks.filter(t => t.status === 'done' && t.proof_verified === true).length },
            { label: t('flagged'),       count: tasks.filter(t => t.proof_verified === false || t.proof_verified === null).length },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-800 px-4 py-3 rounded-lg">
              <p className="text-gray-400 text-xs">{stat.label}</p>
              <p className="text-white font-bold text-xl">{stat.count}</p>
            </div>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">{t('no_tasks')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => {
              const cfg = getStatusConfig(task.status)
              return (
                <div key={task.id} className={`bg-gray-800 rounded-lg p-5 ${cfg.glow}`}>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{task.volunteer_name || 'Volunteer'}</p>
                      <p className="text-gray-400 text-sm">{task.location_text || task.cluster_id}</p>
                      <div className="text-xs mt-1">
                        {task.need_type && <span className="text-orange-400">{task.need_type}</span>}
                        {task.affected_people && <span className="text-gray-500"> · {task.affected_people}</span>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  {getVerificationBadge(task)}
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