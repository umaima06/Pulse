import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Reports() {
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'analyzed'),
      orderBy('timestamp', 'desc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const getUrgencyColor = (score) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-yellow-400'
  }

  const getUrgencyBg = (score) => {
    if (score >= 80) return 'bg-red-900 border-red-700'
    if (score >= 50) return 'bg-orange-900 border-orange-700'
    return 'bg-yellow-900 border-yellow-700'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">{t('loading_reports')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">{t('incoming_reports')}</h2>
        <p className="text-gray-400 mb-8">{t('incoming_sub')}</p>

        {/* Stats strip */}
        <div className="flex gap-4 mb-8">
          <div className="bg-red-900 px-4 py-3 rounded-lg">
            <p className="text-red-300 text-xs">{t('critical').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{reports.filter(r => r.urgency_score >= 80).length}</p>
          </div>
          <div className="bg-orange-900 px-4 py-3 rounded-lg">
            <p className="text-orange-300 text-xs">{t('high').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{reports.filter(r => r.urgency_score >= 50 && r.urgency_score < 80).length}</p>
          </div>
          <div className="bg-gray-700 px-4 py-3 rounded-lg">
            <p className="text-gray-300 text-xs">{t('total').toUpperCase()}</p>
            <p className="text-white font-bold text-xl">{reports.length}</p>
          </div>
        </div>

        {/* Report list */}
        {reports.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">{t('no_reports')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('no_reports_sub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className={`rounded-lg p-5 border ${getUrgencyBg(report.urgency_score)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      {report.need_type && (
                        <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full capitalize">
                          {report.need_type}
                        </span>
                      )}
                      {report.language && (
                        <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                          {report.language}
                        </span>
                      )}
                    </div>
                    {report.summary && (
                      <p className="text-white text-sm mb-2">{report.summary}</p>
                    )}
                    {report.raw_message && (
                      <p className="text-gray-400 text-xs italic">"{report.raw_message}"</p>
                    )}
                    {(report.location_lat && report.location_lng) && (
                      <p className="text-gray-500 text-xs mt-2">
                        📍 {report.location_lat?.toFixed(4)}, {report.location_lng?.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`text-2xl font-bold ${getUrgencyColor(report.urgency_score)}`}>
                      {report.urgency_score || '?'}
                    </p>
                    <p className="text-gray-500 text-xs">{t('urgency')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports