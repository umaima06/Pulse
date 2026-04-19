import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Tasks() {
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
    if (status === 'done')            return 'bg-green-700 text-green-200'
    if (status === 'accepted')        return 'bg-blue-700 text-blue-200'
    if (status === 'declined')        return 'bg-red-700 text-red-200'
    return 'bg-yellow-700 text-yellow-200'
  }

  const getVerificationBadge = (task) => {
    if (task.status !== 'done') return null
    
    return (
    <div className="mt-3 p-3 rounded-lg bg-green-900 border border-green-700">
      <div className="flex items-center justify-between mb-1">
        <span className="text-green-300 text-sm font-bold">✅ Verified Proof</span>
        <span className="text-green-500 text-xs">
          {Math.round((task.proof_confidence || 0) * 100)}% confidence
        </span>
      </div>

      {task.proof_reason && (
        <p className="text-green-200 text-xs">{task.proof_reason}</p>
      )}

      {task.proof_activity && (
        <p className="text-green-600 text-xs mt-1">
          Detected: {task.proof_activity}
        </p>
      )}

      {task.proof_image_url && (
        <a href={task.proof_image_url} target="_blank" rel="noreferrer"
           className="text-green-400 text-xs hover:text-green-300 mt-1 block">
          View verified proof →
        </a>
      )}
    </div>)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">Loading tasks...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Task Tracker</h2>
        <p className="text-gray-400 mb-8">Live volunteer assignments + AI proof verification</p>

        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { label: 'ASSIGNED', count: tasks.filter(t => t.status === 'assigned').length, bg: 'bg-yellow-900', text: 'text-yellow-300' },
            { label: 'ACCEPTED', count: tasks.filter(t => t.status === 'accepted').length, bg: 'bg-blue-900', text: 'text-blue-300' },
            { label: 'AWAITING PROOF', count: tasks.filter(t => t.status === 'awaiting_proof').length, bg: 'bg-purple-900', text: 'text-purple-300' },
            { label: 'VERIFIED', count: tasks.filter(t => t.status === 'done' && t.proof_verified === true).length, bg: 'bg-green-900', text: 'text-green-300' },
            { label: 'FLAGGED', count: tasks.filter(t => t.proof_verified === false || t.proof_verified === null).length, bg: 'bg-red-900', text: 'text-red-300' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} px-4 py-3 rounded-lg`}>
              <p className={`${stat.text} text-xs`}>{stat.label}</p>
              <p className="text-white font-bold text-xl">{stat.count}</p>
            </div>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No tasks yet</p>
            <p className="text-gray-500 text-sm mt-1">Tasks appear when volunteers are assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-gray-800 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{task.volunteer_name || 'Volunteer'}</p>
                    <p className="text-gray-400 text-sm mt-1">{task.location_text || task.cluster_id}</p>
                    <div className="flex gap-2 mt-1">
                      {task.need_type && (
                        <span className="text-orange-400 text-xs capitalize">{task.need_type}</span>
                      )}
                      {task.affected_people && (
                        <span className="text-gray-500 text-xs">· {task.affected_people} people</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ml-4 ${getStatusStyle(task.status)}`}>
                    {task.status === 'done' ? 'DONE' : 'ACCEPTED'}
                  </span>
                </div>

                {getVerificationBadge(task)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tasks