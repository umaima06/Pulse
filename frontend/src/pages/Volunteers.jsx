import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Volunteers() {
  const { t } = useTranslation()
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">{t('loading_volunteers')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <h2 className="text-3xl font-bold mb-2">{t('volunteers')}</h2>
        <p className="text-gray-400 mb-8">{t('no_volunteers_sub')}</p>

        {/* Stats */}
        <div className="flex gap-4 mb-8">
          <div className="bg-emerald-900 px-4 py-3 rounded-lg">
            <p className="text-emerald-300 text-xs">{t('available')}</p>
            <p className="text-white font-bold text-xl">
              {volunteers.filter(v => v.available !== false).length}
            </p>
          </div>

          <div className="bg-red-900 px-4 py-3 rounded-lg">
            <p className="text-red-300 text-xs">{t('busy')}</p>
            <p className="text-white font-bold text-xl">
              {volunteers.filter(v => v.available === false).length}
            </p>
          </div>

          <div className="bg-gray-700 px-4 py-3 rounded-lg">
            <p className="text-gray-300 text-xs">{t('total')}</p>
            <p className="text-white font-bold text-xl">
              {volunteers.length}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {volunteers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">
              {t('no_volunteers')}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {t('no_volunteers_sub')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">

            {volunteers.map(vol => {
              const isAvailable = vol.available !== false

              return (
                <div
                  key={vol.id}
                  className={`bg-gradient-to-r from-gray-900/80 to-gray-800/50 border rounded-2xl p-6 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 ${
                    isAvailable
                      ? 'border-emerald-500/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]'
                      : 'border-red-500/20 hover:shadow-[0_0_25px_rgba(239,68,68,0.1)]'
                  }`}
                >
                  {/* left side */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                      {vol.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div>
                      <p className="font-bold">{vol.name}</p>

                      {vol.organization && (
                        <p className="text-emerald-400 text-xs">
                          {vol.organization}
                        </p>
                      )}

                      <p className="text-gray-500 text-sm">
                        📍 {vol.location} · 📱 {vol.phone}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {(vol.skills || []).map(skill => (
                          <span
                            key={skill}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full capitalize"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* status */}
                  <span
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {isAvailable ? `🟢 ${t('available')}` : `🔴 ${t('busy')}`}
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