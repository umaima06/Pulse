import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Intake() {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    message: '',
    location: '',
    need_type: ''
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
        raw_text: fullText,
        sender: 'NGO_DIRECT',
        need_type: d.need_type,
        urgency_score: d.urgency_score,
        urgency_raw: d.urgency_raw,
        location_text: d.location?.description || form.location,
        district: d.location?.district || '',
        state: d.location?.state || '',
        location_lat: coords.lat || 0,
        location_lng: coords.lon || 0,
        affected_people: d.affected_people,
        days_unmet: d.days_unmet,
        summary: d.summary,
        language: d.language_detected,
        confidence: d.confidence,
        status: 'analyzed',
        timestamp: serverTimestamp(),
        analyzed_at: serverTimestamp()
      })

      setResult({
        need_type: d.need_type,
        urgency_score: d.urgency_score,
        urgency_raw: d.urgency_raw,
        summary: d.summary,
        location: d.location?.description || form.location,
        coords_found: coords.found
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-10">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
            {t('intake')}
          </div>

          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            {t('intake_title')}
          </h2>

          <p className="text-gray-500 text-sm">
            {t('intake_sub')}
          </p>
        </div>

        {status === 'success' && result && (
          <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 border border-emerald-500/30 rounded-2xl p-6 mb-8">
            <p className="text-emerald-400 font-bold mb-4">
              {t('report_saved')}
            </p>

            <div className="space-y-2 text-sm">
              <p>{t('need_label')} <span className="font-semibold capitalize">{result.need_type}</span></p>
              <p>{t('urgency_label')} <span className="font-bold">{result.urgency_score}/100</span></p>
              <p>{result.location} {result.coords_found ? '📍' : '⚠️'}</p>
              <p className="text-gray-500 italic">{result.summary}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/40 border border-red-500/30 rounded-2xl p-5 mb-8">
            <p className="text-red-400 font-medium text-sm">
              {t('report_failed')}
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">
            {t('need_type')}
          </label>

          <div className="flex gap-2">
            {needTypes.map(type => (
              <button
                key={type}
                onClick={() => setForm({ ...form, need_type: type })}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  form.need_type === type
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder={t('location_placeholder')}
          className="w-full mb-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
        />

        <textarea
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder={t('report_placeholder')}
          rows={5}
          className="w-full mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl"
        >
          {loading ? t('analyzing') : t('submit_report')}
        </button>

      </div>
    </div>
  )
}

export default Intake
