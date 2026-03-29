import { useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function VolunteerPortal() {
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const findTasks = () => {
    if (!phone) return
    setLoading(true)
    setSubmitted(true)
    onSnapshot(
      query(collection(db, 'tasks'), where('volunteer_phone', '==', phone)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setTasks(data)
        setLoading(false)
      }
    )
  }

  const updateTask = async (taskId, status) => {
    setActionLoading(taskId + status)
    try {
      await fetch('http://localhost:3000/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, status })
      })
    } catch {
      alert('Could not update task. Make sure backend is running.')
    }
    setActionLoading('')
  }

  const getStatusStyle = (status) => {
    if (status === 'accepted') return 'bg-blue-700 text-blue-200'
    if (status === 'done') return 'bg-green-700 text-green-200'
    return 'bg-yellow-700 text-yellow-200'
  }

  const getUrgencyColor = (urgency) => {
    if (urgency >= 80) return 'text-red-400'
    if (urgency >= 50) return 'text-orange-400'
    return 'text-yellow-400'
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Volunteer Portal</h2>
        <p className="text-gray-400 mb-8">Enter your phone number to see your assigned tasks</p>

        {!submitted ? (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <label className="text-gray-300 text-sm mb-2 block">Your WhatsApp Number</label>
            <div className="flex gap-3">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findTasks()}
                placeholder="+91 9876543210"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400"
              />
              <button onClick={findTasks}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition-all">
                Find Tasks
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setSubmitted(false); setPhone(''); setTasks([]) }}
              className="text-gray-400 hover:text-white text-sm mb-6">
              Back
            </button>

            {loading ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Looking up tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-300 text-lg font-medium">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">No tasks assigned to {phone}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">{tasks.length} task(s) found for {phone}</p>
                {tasks.map(task => (
                  <div key={task.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-white font-bold text-lg capitalize">
                          {task.need_type || 'Crisis Response'} Task
                        </p>
                        <p className="text-gray-400 text-sm mt-1">Cluster ID: {task.cluster_id}</p>
                      </div>
                      <span className={"px-3 py-1 rounded-full text-xs font-bold uppercase " + getStatusStyle(task.status)}>
                        {task.status || 'pending'}
                      </span>
                    </div>

                    {task.urgency && (
                      <div className="bg-gray-700 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-400 text-xs">URGENCY LEVEL</p>
                          <p className={"font-bold " + getUrgencyColor(task.urgency)}>{task.urgency}/100</p>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{
                            width: task.urgency + '%',
                            backgroundColor: task.urgency >= 80 ? '#ef4444' : task.urgency >= 50 ? '#f97316' : '#eab308'
                          }} />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTask(task.id, 'accepted')}
                          disabled={actionLoading === task.id + 'accepted'}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                          {actionLoading === task.id + 'accepted' ? 'Updating...' : 'Accept Task'}
                        </button>
                      )}
                      {task.status === 'accepted' && (
                        <button
                          onClick={() => updateTask(task.id, 'done')}
                          disabled={actionLoading === task.id + 'done'}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                          {actionLoading === task.id + 'done' ? 'Updating...' : 'Mark as Done'}
                        </button>
                      )}
                      {task.status === 'done' && (
                        <div className="flex-1 bg-gray-700 text-gray-400 font-bold py-3 rounded-lg text-center">
                          Task Completed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VolunteerPortal