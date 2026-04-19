import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

function Intake() {
  const [form, setForm] = useState({ message: '', location: '', need_type: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const locationHook = useLocation()
  const needTypes = ['medical', 'food', 'water']

  const handleSubmit = async () => {
    if (!form.message || !form.location) { setStatus('error'); return }
    setLoading(true); setResult(null)
    try {
      const fullText = `${form.need_type ? form.need_type + ': ' : ''}${form.message}. Location: ${form.location}`
      const aiRes = await fetch('http://localhost:5000/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText })
      })
      const aiData = await aiRes.json()
      if (!aiData.success) { setStatus('error'); setLoading(false); return }
      const d = aiData.data
      const coords = d.coordinates || {}
      await addDoc(collection(db, 'reports'), {
        raw_text: fullText, sender: 'NGO_DIRECT', need_type: d.need_type,
        urgency_score: d.urgency_score, urgency_raw: d.urgency_raw,
        location_text: d.location?.description || form.location,
        district: d.location?.district || '', state: d.location?.state || '',
        location_lat: coords.lat || 0, location_lng: coords.lon || 0,
        affected_people: d.affected_people, days_unmet: d.days_unmet,
        summary: d.summary, language: d.language_detected,
        confidence: d.confidence, status: 'analyzed',
        timestamp: serverTimestamp(), analyzed_at: serverTimestamp()
      })
      setResult({ need_type: d.need_type, urgency_score: d.urgency_score, urgency_raw: d.urgency_raw, summary: d.summary, location: d.location?.description || form.location, coords_found: coords.found })
      setStatus('success')
      setForm({ message: '', location: '', need_type: '' })
    } catch (err) { console.error(err); setStatus('error') }
    setLoading(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(locationHook.search)
    const msg = params.get("msg")
    if (msg) {
      let detectedType = ""
      if (msg.toLowerCase().includes("water") || msg.includes("paani")) detectedType = "water"
      else if (msg.toLowerCase().includes("food") || msg.includes("khana")) detectedType = "food"
      else if (msg.toLowerCase().includes("medical") || msg.includes("bimaar")) detectedType = "medical"
      setForm(prev => ({ ...prev, message: msg, need_type: detectedType }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
            Manual Intake
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Report Intake
          </h2>
          <p className="text-gray-500 text-sm">NGO coordinator can directly log a crisis report</p>
        </div>

        {/* Success */}
        {status === 'success' && result && (
          <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 border border-emerald-500/30 rounded-2xl p-6 mb-8 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] transition-all">
            <p className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Report analyzed and saved
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300"><span className="text-gray-600 uppercase text-xs tracking-widest mr-2">Need</span><span className="capitalize font-semibold text-white">{result.need_type}</span></p>
              <p className="text-gray-300">
                <span className="text-gray-600 uppercase text-xs tracking-widest mr-2">Urgency</span>
                <span className={`font-black text-lg ${result.urgency_score >= 80 ? 'text-red-400' : result.urgency_score >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {result.urgency_score}/100
                </span>
                <span className="text-gray-500 text-xs ml-1">({result.urgency_raw})</span>
              </p>
              <p className="text-gray-300"><span className="text-gray-600 uppercase text-xs tracking-widest mr-2">Location</span>{result.location} {result.coords_found ? '📍' : '⚠️'}</p>
              <p className="text-gray-500 text-xs italic mt-3 border-t border-white/5 pt-3">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-gradient-to-br from-red-950/80 to-red-900/40 border border-red-500/30 rounded-2xl p-5 mb-8">
            <p className="text-red-400 font-medium text-sm">❌ Failed. Make sure AI server is running on port 5000 and fill all required fields.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Need Type */}
          <div>
            <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3 block">Need Type</label>
            <div className="flex gap-2">
              {needTypes.map(type => (
                <button key={type} onClick={() => setForm({ ...form, need_type: type })}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${
                    form.need_type === type
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2 block">Location *</label>
            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Village name, District, State"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all" />
          </div>

          {/* Message */}
          <div>
            <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2 block">Report Message *</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Describe the crisis situation..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all resize-none" />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-600 text-white font-black py-4 rounded-xl transition-all text-lg hover:scale-[1.02] active:scale-98 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)]">
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Analyzing with AI...
              </span>
            ) : 'Submit Report →'}
          </button>

          {/* Demo trigger */}
          <button onClick={async () => {
            setLoading(true)
            try { await fetch('http://localhost:3000/demo-trigger', { method: 'POST' }); setStatus('success') }
            catch { setStatus('error') }
            setLoading(false)
          }}
            className="w-full bg-gradient-to-r from-red-600/80 to-red-500/80 hover:from-red-600 hover:to-red-500 text-white font-black py-4 rounded-xl transition-all text-lg hover:scale-[1.02] active:scale-98 border border-red-500/30">
            🎬 Fire Demo Sequence
          </button>
        </div>
      </div>
    </div>
  )
}

export default Intake