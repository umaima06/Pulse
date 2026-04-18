import { useState } from 'react'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { doc, updateDoc } from 'firebase/firestore'

function VolunteerPortal() {
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [available, setAvailable] = useState(true)

const findTasks = async () => {
  if (!phone) return

  setLoading(true)
  setSubmitted(true)

  const q = query(
    collection(db, 'volunteers'),
    where('phone', '==', phone)
  )

  const snap = await getDocs(q)

  if (snap.empty) {
    alert("Volunteer not found")
    setLoading(false)
    return
  }

  const volunteerId = snap.docs[0].id

  onSnapshot(
    query(collection(db, 'tasks'), where('volunteer_id', '==', volunteerId)),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
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

    // 💥 AUTO AVAILABILITY LOGIC
const q = query(
  collection(db, 'volunteers'),
  where('phone', '==', phone)
)

const snap = await getDocs(q)

if (!snap.empty) {
  const volunteerDoc = snap.docs[0]

  await updateDoc(volunteerDoc.ref, {
    available: status === 'done'
  })

  setAvailable(status === 'done')
}

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

const toggleAvailability = async () => {
  const newStatus = !available

  try {
    const q = query(
      collection(db, 'volunteers'),
      where('phone', '==', phone)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      alert("Volunteer not found")
      return
    }

    const volunteerDoc = snapshot.docs[0]

    await updateDoc(volunteerDoc.ref, {
      available: newStatus
    })

    // ✅ only update UI AFTER success
    setAvailable(newStatus)

  } catch (err) {
    console.error(err)
    alert("Failed to update availability")
  }
}

console.log("Searching for:", phone)


  const doneTasks = tasks.filter(t => t.status === 'done')
  const activeTasks = tasks.filter(t => t.status !== 'done')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">My Tasks</h2>
        <p className="text-gray-400 mb-8">Enter your WhatsApp number to see assigned tasks</p>

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
                Find →
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => { setSubmitted(false); setPhone(''); setTasks([]) }}
                className="text-gray-400 hover:text-white text-sm">
                ← Search again
              </button>
              <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                <span className="text-gray-300 text-sm">Available</span>
                <button
                  onClick={toggleAvailability}
                  className={"w-12 h-6 rounded-full transition-all relative " + (available ? 'bg-green-500' : 'bg-gray-600')}>
                  <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all " + (available ? 'left-6' : 'left-0.5')}></div>
                </button>
                <span className={"text-sm font-medium " + (available ? 'text-green-400' : 'text-gray-400')}>
                  {available ? 'On duty' : 'Off duty'}
                </span>
              </div>
            </div>

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
              <div>
                <div className="flex gap-3 mb-6">
                  <div className="bg-yellow-900 px-4 py-2 rounded-lg">
                    <p className="text-yellow-300 text-xs">ACTIVE</p>
                    <p className="text-white font-bold text-xl">{activeTasks.length}</p>
                  </div>
                  <div className="bg-green-900 px-4 py-2 rounded-lg">
                    <p className="text-green-300 text-xs">COMPLETED</p>
                    <p className="text-white font-bold text-xl">{doneTasks.length}</p>
                  </div>
                  <div className="bg-gray-700 px-4 py-2 rounded-lg">
                    <p className="text-gray-300 text-xs">TOTAL</p>
                    <p className="text-white font-bold text-xl">{tasks.length}</p>
                  </div>
                </div>

                {activeTasks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-bold mb-3">Active Tasks</h3>
                    <div className="space-y-4">
                      {activeTasks.map(task => (
                        <div key={task.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-white font-bold text-lg capitalize">
                                {task.need_type || 'Crisis Response'} Task
                              </p>
                              <p className="text-gray-400 text-sm mt-1">ID: {task.cluster_id}</p>
                            </div>
                            <span className={"px-3 py-1 rounded-full text-xs font-bold uppercase " + getStatusStyle(task.status)}>
                              {task.status || 'pending'}
                            </span>
                          </div>

                          {task.urgency && (
                            <div className="bg-gray-700 rounded-lg p-3 mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-400 text-xs">URGENCY</p>
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

                          {task.cluster_lat && task.cluster_lon && (
  <a
    href={"https://www.google.com/maps/dir/?api=1&destination=" + task.cluster_lat + "," + task.cluster_lon}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded-lg p-3 mb-4 text-sm transition-all font-medium">
    📍 Get Directions → Google Maps
  </a>
)}

                          <div className="flex gap-3">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => updateTask(task.id, 'accepted')}
                                disabled={actionLoading === task.id + 'accepted'}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                                {actionLoading === task.id + 'accepted' ? 'Updating...' : '✅ Accept Task'}
                              </button>
                            )}
                            {task.status === 'accepted' && (
                              <button
                                onClick={() => updateTask(task.id, 'done')}
                                disabled={actionLoading === task.id + 'done'}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                                {actionLoading === task.id + 'done' ? 'Updating...' : '🎉 Mark as Done'}
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
                    <h3 className="text-gray-400 font-bold mb-3">Task History</h3>
                    <div className="space-y-3">
                      {doneTasks.map(task => (
                        <div key={task.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 opacity-60">
                          <div className="flex items-center justify-between">
                            <p className="text-gray-300 capitalize">{task.need_type || 'Crisis Response'} Task</p>
                            <span className="bg-green-700 text-green-200 px-3 py-1 rounded-full text-xs font-bold">DONE</span>
                          </div>
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