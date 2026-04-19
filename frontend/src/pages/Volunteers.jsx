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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setVolunteers(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">{t('loading_volunteers')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">{t('volunteers')}</h2>
        <p className="text-gray-400 mb-8">{t('volunteer_sub')}</p>

        <div className="flex gap-4 mb-8">
          <div className="bg-green-900 px-4 py-3 rounded-lg">
            <p className="text-green-300 text-xs">{t('available').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{volunteers.filter(v => v.available !== false).length}</p>
          </div>
          <div className="bg-red-900 px-4 py-3 rounded-lg">
            <p className="text-red-300 text-xs">{t('busy').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{volunteers.filter(v => v.available === false).length}</p>
          </div>
          <div className="bg-gray-700 px-4 py-3 rounded-lg">
            <p className="text-gray-300 text-xs">{t('total').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{volunteers.length}</p>
          </div>
        </div>

        {volunteers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">{t('no_volunteers')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('no_volunteers_sub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {volunteers.map(vol => (
              <div key={vol.id} className="bg-gray-800 rounded-lg p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{vol.name}</p>
                  <p className="text-gray-400 text-sm">📍 {vol.location}</p>
                  <p className="text-gray-400 text-sm">📱 {vol.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(vol.skills || []).map(skill => (
                      <span key={skill} className="bg-orange-900 text-orange-300 text-xs px-2 py-1 rounded-full capitalize">{skill}</span>
                    ))}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${vol.available !== false ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
                  {vol.available !== false ? t('available') : t('busy')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Volunteers