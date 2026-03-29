import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setTasks(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const getStatusStyle = (status) => {
    if (status === 'accepted') return 'bg-blue-700 text-blue-200'
    if (status === 'done') return 'bg-green-700 text-green-200'
    return 'bg-yellow-700 text-yellow-200'
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
        <p className="text-gray-400 mb-8">Live volunteer assignments</p>
        <div className="flex gap-4 mb-8">
          <div className="bg-yellow-900 px-4 py-3 rounded-lg">
            <p className="text-yellow-300 text-xs">PENDING</p>
            <p className="text-white font-bold text-xl">{tasks.filter(t => t.status === 'pending').length}</p>
          </div>
          <div className="bg-blue-900 px-4 py-3 rounded-lg">
            <p className="text-blue-300 text-xs">ACCEPTED</p>
            <p className="text-white font-bold text-xl">{tasks.filter(t => t.status === 'accepted').length}</p>
          </div>
          <div className="bg-green-900 px-4 py-3 rounded-lg">
            <p className="text-green-300 text-xs">DONE</p>
            <p className="text-white font-bold text-xl">{tasks.filter(t => t.status === 'done').length}</p>
          </div>
          <div className="bg-gray-700 px-4 py-3 rounded-lg">
            <p className="text-gray-300 text-xs">TOTAL</p>
            <p className="text-white font-bold text-xl">{tasks.length}</p>
          </div>
        </div>
        {tasks.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No tasks yet</p>
            <p className="text-gray-500 text-sm mt-1">Tasks appear when volunteers are auto-assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-gray-800 rounded-lg p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{task.volunteer_name || 'Volunteer'}</p>
                  <p className="text-gray-400 text-sm mt-1">Cluster: {task.cluster_id}</p>
                  {task.need_type && <p className="text-orange-400 text-xs mt-1 capitalize">{task.need_type}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(task.status)}`}>
                  {task.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tasks