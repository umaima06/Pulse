import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Intake() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    message: '', location: '', need_type: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const locationHook = useLocation()
  const needTypes = ['medical', 'food', 'water']

  const handleSubmit = async () => {
    if (!form.message || !form.location) {
      setStatus('error')
      return
    }
    setLoading(true)
    setResult(null)

    try {
      const fullText = `${form.need_type ? form.need_type + ': ' : ''}${form.message}. Location: ${form.location}`

      const aiRes = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText })
      })
      const aiData = await aiRes.json()

      if (!aiData.success) {
        setStatus('error')
        setLoading(false)
        return
      }

      const d = aiData.data
      const coords = d.coordinates || {}

      await addDoc(collection(db, 'reports'), {
        raw_text:        fullText,
        sender:          'NGO_DIRECT',
        need_type:       d.need_type,
        urgency_score:   d.urgency_score,
        urgency_raw:     d.urgency_raw,
        location_text:   d.location?.description || form.location,
        district:        d.location?.district || '',
        state:           d.location?.state || '',
        location_lat:    coords.lat || 0,
        location_lng:    coords.lon || 0,
        affected_people: d.affected_people,
        days_unmet:      d.days_unmet,
        summary:         d.summary,
        language:        d.language_detected,
        confidence:      d.confidence,
        status:          'analyzed',
        timestamp:       serverTimestamp(),
        analyzed_at:     serverTimestamp()
      })

      setResult({
        need_type:     d.need_type,
        urgency_score: d.urgency_score,
        urgency_raw:   d.urgency_raw,
        summary:       d.summary,
        location:      d.location?.description || form.location,
        coords_found:  coords.found
      })

      setStatus('success')
      setForm({ message: '', location: '', need_type: '' })

    } catch (err) {
      console.error(err)
      setStatus('error')
    }

    setLoading(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(locationHook.search)
    const msg = params.get("msg")

    if (msg) {
      let detectedType = ""

      if (msg.toLowerCase().includes("water") || msg.includes("paani")) {
        detectedType = "water"
      } else if (msg.toLowerCase().includes("food") || msg.includes("khana")) {
        detectedType = "food"
      } else if (msg.toLowerCase().includes("medical") || msg.includes("bimaar")) {
        detectedType = "medical"
      }

      setForm(prev => ({
        ...prev,
        message: msg,
        need_type: detectedType
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">{t('intake_title')}</h2>
        <p className="text-gray-400 mb-8">{t('intake_sub')}</p>

        {/* Success State */}
        {status === 'success' && result && (
          <div className="bg-green-900 border border-green-500 rounded-lg p-5 mb-6">
            <p className="text-green-300 font-bold mb-3">✅ {t('report_saved')}</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                <span className="text-gray-500">{t('need_label')} </span>
                <span className="capitalize font-medium">{result.need_type}</span>
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">{t('urgency_label')} </span>
                <span className={`font-bold ${result.urgency_score >= 80 ? 'text-red-400' : result.urgency_score >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {result.urgency_score}/100 ({result.urgency_raw})
                </span>
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">{t('location_label').replace(' *', '')} </span>
                {result.location} {result.coords_found ? '📍' : `⚠️ ${t('location_found')}`}
              </p>
              <p className="text-gray-300 mt-2 italic text-xs">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-medium">{t('report_failed')}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Need Type */}
          <div>
            <label className="text-gray-300 text-sm mb-2 block">{t('need_type')}</label>
            <div className="flex gap-2">
              {needTypes.map(type => (
                <button key={type}
                  onClick={() => setForm({ ...form, need_type: type })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    form.need_type === type
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-400'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">{t('location_label')}</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder={t('location_placeholder')}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">{t('report_message')}</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder={t('report_placeholder')}
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('analyzing')}
              </span>
            ) : t('submit_report')}
          </button>

          {/* Demo trigger */}
          <button
            onClick={async () => {
              setLoading(true)
              try {
                await fetch('http://localhost:3000/demo-trigger', { method: 'POST' })
                setStatus('success')
              } catch { setStatus('error') }
              setLoading(false)
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {t('fire_demo')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Intake