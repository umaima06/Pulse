import { useState } from 'react'
import Navbar from '../components/Navbar'

function Volunteer() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', skills: [], organization: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const skillOptions = ['medical', 'food', 'water', 'shelter', 'rescue', 'transport', 'education']

  const toggleSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill] }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.location || form.skills.length === 0) { setStatus('error'); return }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/register-volunteer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) { setStatus('success'); setForm({ name: '', email: '', phone: '', location: '', skills: [], organization: '' }) }
      else setStatus('error')
    } catch { setStatus('error') }
    setLoading(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2 rounded-full mb-5 font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
            Join the Network
          </div>
          <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            Register as Volunteer
          </h2>
          <p className="text-gray-500 text-sm">Join PULSE to help communities in crisis</p>
        </div>

        {status === 'success' && (
          <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 border border-emerald-500/30 rounded-2xl p-5 mb-8">
            <p className="text-emerald-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Registered! You will receive WhatsApp alerts.
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-gradient-to-br from-red-950/80 to-red-900/40 border border-red-500/30 rounded-2xl p-5 mb-8">
            <p className="text-red-400 font-medium text-sm">❌ Fill all fields and select at least one skill.</p>
          </div>
        )}

        <div className="space-y-6">
          {[
            { label: 'Full Name *', key: 'name', placeholder: 'Ali Hassan', type: 'text' },
            { label: 'Organization / NGO Name', key: 'organization', placeholder: 'Red Cross, Helping Hands, etc.', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'ali@email.com', type: 'email' },
            { label: 'WhatsApp Number *', key: 'phone', placeholder: '+91 9876543210', type: 'tel' },
            { label: 'Your City/Location *', key: 'location', placeholder: 'Hyderabad, Telangana', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2 block">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder} className={inputClass} />
            </div>
          ))}

          <div>
            <label className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3 block">Skills * (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map(skill => (
                <button key={skill} onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${
                    form.skills.includes(skill)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-600 text-white font-black py-4 rounded-xl transition-all text-lg hover:scale-[1.02] active:scale-98 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)]">
            {loading ? 'Registering...' : 'Register as Volunteer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Volunteer