import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/analytics')
      .then(r => r.json())
      .then(data => {
        setAnalytics(data.analytics)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">Loading analytics...</p>
    </div>
  )

  if (!analytics) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-gray-400">Could not load analytics. Make sure backend is running.</p>
      </div>
    </div>
  )

  const StatCard = ({ label, value, color, sub }) => (
    <div className={`${color} px-5 py-4 rounded-xl`}>
      <p className="text-xs opacity-70 uppercase font-medium">{label}</p>
      <p className="text-white font-black text-3xl mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )

  const BarStat = ({ label, value, max, color }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-gray-300 text-sm capitalize">{label}</span>
        <span className="text-white font-bold text-sm">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Analytics</h2>
        <p className="text-gray-400 mb-8">Full system overview — live from Firestore</p>

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          <StatCard label="Total Reports" value={analytics.reports.total} color="bg-blue-900" sub={`${analytics.reports.analyzed} analyzed`} />
          <StatCard label="People Affected" value={analytics.reports.total_affected} color="bg-red-900" />
          <StatCard label="Volunteers" value={analytics.volunteers.total} color="bg-green-900" sub={`${analytics.volunteers.available} available`} />
          <StatCard label="Tasks Done" value={analytics.tasks.done} color="bg-purple-900" sub={`of ${analytics.tasks.total} total`} />
        </div>

        {/* Reports breakdown */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-5">Reports by Type</h3>
            <BarStat label="💧 Water" value={analytics.reports.by_type.water} max={analytics.reports.total} color="bg-blue-500" />
            <BarStat label="🍱 Food" value={analytics.reports.by_type.food} max={analytics.reports.total} color="bg-orange-500" />
            <BarStat label="🏥 Medical" value={analytics.reports.by_type.medical} max={analytics.reports.total} color="bg-red-500" />
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-5">Cluster Severity</h3>
            <BarStat label="🔴 Critical (80+)" value={analytics.clusters.critical} max={analytics.clusters.total} color="bg-red-500" />
            <BarStat label="🟠 High (50-79)" value={analytics.clusters.high} max={analytics.clusters.total} color="bg-orange-500" />
            <BarStat label="🟡 Medium (<50)" value={analytics.clusters.medium} max={analytics.clusters.total} color="bg-yellow-500" />
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-5">Volunteer Status</h3>
            <BarStat label="✅ Available" value={analytics.volunteers.available} max={analytics.volunteers.total} color="bg-green-500" />
            <BarStat label="🚀 Deployed" value={analytics.volunteers.deployed} max={analytics.volunteers.total} color="bg-blue-500" />
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-5">Task Status</h3>
            <BarStat label="📋 Assigned" value={analytics.tasks.assigned} max={analytics.tasks.total} color="bg-yellow-500" />
            <BarStat label="✅ Accepted" value={analytics.tasks.accepted} max={analytics.tasks.total} color="bg-blue-500" />
            <BarStat label="🎉 Done" value={analytics.tasks.done} max={analytics.tasks.total} color="bg-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics