import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function PredictiveAlerts() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/predictive-alerts')
      .then(r => r.json())
      .then(data => { setAlerts(data.alerts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getConfidenceBg = (conf) => {
    if (conf === 'HIGH') return 'bg-red-900 border-red-700'
    if (conf === 'MEDIUM') return 'bg-orange-900 border-orange-700'
    return 'bg-yellow-900 border-yellow-700'
  }

  const getConfidenceColor = (conf) => {
    if (conf === 'HIGH') return 'text-red-400'
    if (conf === 'MEDIUM') return 'text-orange-400'
    return 'text-yellow-400'
  }

  const needEmoji = { water: '💧', food: '🍱', medical: '🏥' }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">{t('loading_analytics')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔮</span>
          <h2 className="text-3xl font-bold">{t('predictive_title')}</h2>
        </div>
        <p className="text-gray-400 mb-8">{t('predictive_sub')}</p>

        <div className="flex gap-4 mb-8">
          <div className="bg-red-900 px-4 py-3 rounded-lg">
            <p className="text-red-300 text-xs">{t('high_confidence')}</p>
            <p className="text-white font-bold text-xl">{alerts.filter(a => a.confidence === 'HIGH').length}</p>
          </div>
          <div className="bg-orange-900 px-4 py-3 rounded-lg">
            <p className="text-orange-300 text-xs">{t('medium_conf')}</p>
            <p className="text-white font-bold text-xl">{alerts.filter(a => a.confidence === 'MEDIUM').length}</p>
          </div>
          <div className="bg-gray-700 px-4 py-3 rounded-lg">
            <p className="text-gray-300 text-xs">{t('total_predictions')}</p>
            <p className="text-white font-bold text-xl">{alerts.length}</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">🔮</p>
            <p className="text-gray-400 text-lg">{t('no_predictions')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('no_predictions_sub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`rounded-lg p-5 border ${getConfidenceBg(alert.confidence)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full capitalize">
                        {needEmoji[alert.need_type]} {alert.need_type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${getConfidenceColor(alert.confidence)} bg-gray-700`}>
                        {alert.confidence} CONFIDENCE
                      </span>
                    </div>
                    <p className="text-white font-medium text-lg">📍 {alert.region}</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Predicted crisis in <span className="text-orange-400 font-bold">{alert.predicted_month}</span>
                    </p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-gray-500 text-xs">{t('historical_incidents')}</p>
                        <p className="text-white font-bold">{alert.historical_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">{t('avg_affected')}</p>
                        <p className="text-white font-bold">{alert.avg_affected}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-gray-400 text-xs mb-1">PRE-POSITION</p>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg font-bold transition-all">
                      {t('alert_ngo')}
                    </button>
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

export default PredictiveAlerts