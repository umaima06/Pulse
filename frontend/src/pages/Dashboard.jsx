import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

const mapContainerStyle = { width: '100%', height: '100%' }
const center = { lat: 20.5937, lng: 78.9629 }

function Dashboard() {
  const [clusters, setClusters] = useState([])
  const [selected, setSelected] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clusters'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setClusters(data)
    })
    return () => unsub()
  }, [])

  const getColor = (urgency) => {
    if (urgency >= 80) return '#ef4444'
    if (urgency >= 50) return '#f97316'
    return '#eab308'
  }

  const getLabel = (urgency) => {
    if (urgency >= 80) return { text: 'CRITICAL', bg: 'bg-red-600' }
    if (urgency >= 50) return { text: 'HIGH', bg: 'bg-orange-500' }
    return { text: 'MEDIUM', bg: 'bg-yellow-500' }
  }

  if (!isLoaded) return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading map...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Navbar />

      {/* Stats Bar */}
      <div className="flex gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="bg-red-900 px-4 py-2 rounded-lg">
          <p className="text-red-300 text-xs">CRITICAL</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency >= 80).length}</p>
        </div>
        <div className="bg-orange-900 px-4 py-2 rounded-lg">
          <p className="text-orange-300 text-xs">HIGH</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency >= 50 && c.combined_urgency < 80).length}</p>
        </div>
        <div className="bg-yellow-900 px-4 py-2 rounded-lg">
          <p className="text-yellow-300 text-xs">MEDIUM</p>
          <p className="text-white font-bold text-xl">{clusters.filter(c => c.combined_urgency < 50).length}</p>
        </div>
        <div className="bg-gray-700 px-4 py-2 rounded-lg">
          <p className="text-gray-300 text-xs">TOTAL CLUSTERS</p>
          <p className="text-white font-bold text-xl">{clusters.length}</p>
        </div>
      </div>

      {/* Map + Side Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
            {clusters.map(cluster => (
              cluster.centroid_lat && cluster.centroid_lon ? (
                <Circle
                  key={cluster.id}
                  center={{ lat: cluster.centroid_lat, lng: cluster.centroid_lon }}
                  radius={15000}
                  options={{
                    strokeColor: getColor(cluster.combined_urgency),
                    fillColor: getColor(cluster.combined_urgency),
                    fillOpacity: 0.5,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelected(cluster)}
                />
              ) : null
            ))}
          </GoogleMap>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
          {selected ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Cluster Details</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold mb-4 ${getLabel(selected.combined_urgency).bg}`}>
                {getLabel(selected.combined_urgency).text} — {selected.combined_urgency}/100
              </div>
              <div className="space-y-3">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">NEED TYPE</p>
                  <p className="text-white font-medium capitalize">{selected.need_type || 'Unknown'}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">REPORTS IN CLUSTER</p>
                  <p className="text-white font-medium">{selected.report_count || 1}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">LOCATION</p>
                  <p className="text-white font-medium text-sm">{selected.centroid_lat?.toFixed(4)}, {selected.centroid_lon?.toFixed(4)}</p>
                </div>
                {selected.summary && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">SUMMARY</p>
                    <p className="text-white text-sm">{selected.summary}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">URGENCY LEVEL</p>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${selected.combined_urgency}%`, backgroundColor: getColor(selected.combined_urgency) }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <h2 className="text-white font-bold text-lg mb-3">All Clusters</h2>
              <p className="text-gray-400 text-sm mb-4">Click a circle on the map to see details</p>
              <div className="space-y-2">
                {clusters.map(cluster => (
                  <div key={cluster.id} onClick={() => setSelected(cluster)} className="bg-gray-700 hover:bg-gray-600 cursor-pointer rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{cluster.need_type || 'Unknown'}</p>
                      <p className="text-gray-400 text-xs">{cluster.report_count || 1} reports</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: getColor(cluster.combined_urgency) }}>
                      {cluster.combined_urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard