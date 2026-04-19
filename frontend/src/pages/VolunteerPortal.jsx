import { useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function VolunteerPortal() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [available, setAvailable] = useState(true)

  const findTasks = () => {
    if (!phone) return
    setLoading(true); setSubmitted(true)
    onSnapshot(query(collection(db, 'tasks'), where('volunteer_phone', '==', phone)), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
  }

  const updateTask = async (taskId, status) => {
    setActionLoading(taskId + status)
    try {
      await fetch('http://localhost:3000/update-task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, status })
      })
    } catch { alert(t('update_error')) }
    setActionLoading('')
  }

  const doneTasks = tasks.filter(t => t.status === 'done')
  const activeTasks = tasks.filter(t => t.status !== 'done')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
            {t('volunteer_portal')}
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            {t('my_tasks')}
          </h2>
          <p className="text-gray-500 text-sm">{t('enter_whatsapp')}</p>
        </div>

        {!submitted ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
            <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3 block">{t('whatsapp_number')}</label>
            <div className="flex gap-3">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findTasks()}
                placeholder={t('phone_placeholder')}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all" />
              <button onClick={findTasks}
                className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white font-black px-6 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {t('find')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => { setSubmitted(false); setPhone(''); setTasks([]) }}
                className="text-gray-500 hover:text-emerald-400 text-sm transition-colors font-medium">
                {t('search_again')}
              </button>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                <span className="text-gray-400 text-sm">{t('status')}</span>
                <button onClick={() => setAvailable(!available)}
                  className={`w-12 h-6 rounded-full transition-all relative ${available ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-gray-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${available ? 'left-6' : 'left-0.5'}`}></div>
                </button>
                <span className={`text-sm font-bold ${available ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {available ? t('on_duty') : t('off_duty')}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-400 text-sm tracking-widest animate-pulse">{t('looking_up')}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-6xl mb-5">📭</p>
                <p className="text-gray-300 text-xl font-bold mb-2">{t('no_tasks_found')}</p>
                <p className="text-gray-600 text-sm">{t('no_tasks_for_phone')} {phone}</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: t('active'), value: activeTasks.length, bg: 'bg-gradient-to-br from-yellow-950/60 to-yellow-900/20', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
                    { label: t('completed'), value: doneTasks.length, bg: 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/20', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
                    { label: t('total'), value: tasks.length, bg: 'bg-gradient-to-br from-gray-900/80 to-gray-800/40', border: 'border-white/10', text: 'text-white', dot: 'bg-gray-400' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 text-center relative overflow-hidden`}>
                      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} animate-pulse`}></div>
                      <p className="text-xs text-gray-500 font-bold tracking-widest mb-2 uppercase">{s.label}</p>
                      <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {activeTasks.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white font-bold mb-4 text-lg flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      {t('active_tasks')}
                    </h3>
                    <div className="space-y-4">
                      {activeTasks.map(task => (
                        <div key={task.id} className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] transition-all relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-emerald-500 opacity-70"></div>
                          <div className="flex items-start justify-between mb-5 pl-3">
                            <div>
                              <p className="text-white font-black text-lg capitalize">{task.need_type || t('crisis_task')} Task</p>
                              <p className="text-gray-600 text-xs font-mono mt-1">ID: {task.cluster_id}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest ${task.status === 'accepted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                              {task.status || 'pending'}
                            </span>
                          </div>
                          {task.urgency && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 ml-3">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">{t('urgency_level')}</p>
                                <p className={`font-black text-xl ${task.urgency >= 80 ? 'text-red-400' : task.urgency >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>{task.urgency}/100</p>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div className="h-2 rounded-full transition-all duration-700"
                                  style={{ width: task.urgency + '%', backgroundColor: task.urgency >= 80 ? '#ef4444' : task.urgency >= 50 ? '#f97316' : '#eab308' }} />
                              </div>
                            </div>
                          )}
                          {task.cluster_lat && task.cluster_lon && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${task.cluster_lat},${task.cluster_lon}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center justify-center gap-2 bg-blue-500/15 border border-blue-500/25 hover:bg-blue-500/25 text-blue-400 rounded-xl p-3 mb-4 text-sm transition-all font-bold hover:scale-[1.02] ml-3">
                              {t('directions')}
                            </a>
                          )}
                          <div className="flex gap-3 pl-3">
                            {task.status === 'pending' && (
                              <button onClick={() => updateTask(task.id, 'accepted')} disabled={actionLoading === task.id + 'accepted'}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-98">
                                {actionLoading === task.id + 'accepted' ? t('updating') : t('accept_task')}
                              </button>
                            )}
                            {task.status === 'accepted' && (
                              <button onClick={() => updateTask(task.id, 'done')} disabled={actionLoading === task.id + 'done'}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-98 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                {actionLoading === task.id + 'done' ? t('updating') : t('mark_done')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doneTasks.length > 0 && (
                  <div>
                    <h3 className="text-gray-500 font-bold mb-4 text-sm tracking-widest uppercase">{t('task_history_title')}</h3>
                    <div className="space-y-3">
                      {doneTasks.map(task => (
                        <div key={task.id} className="bg-gray-900/40 border border-white/5 rounded-xl p-4 opacity-50 flex items-center justify-between">
                          <p className="text-gray-400 capitalize font-medium text-sm">{task.need_type || t('crisis_task')} Task</p>
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-xl text-xs font-bold">✅ {t('done')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VolunteerPortal