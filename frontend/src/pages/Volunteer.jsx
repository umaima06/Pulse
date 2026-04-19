import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

function Volunteer() {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
    organization: ''
  })

  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const skillOptions = [
    'medical',
    'food',
    'water',
    'shelter',
    'rescue',
    'transport',
    'education'
  ]

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.location || form.skills.length === 0) {
      setStatus('error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:3000/register-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setStatus('success')
        setForm({
          name: '',
          email: '',
          phone: '',
          location: '',
          skills: [],
          organization: ''
        })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }

    setLoading(false)
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Header */}
        <h2 className="text-3xl font-bold mb-2">
          {t('volunteer_title')}
        </h2>
        <p className="text-gray-400 mb-8">
          {t('volunteer_sub')}
        </p>

        {/* Status */}
        {status === 'success' && (
          <div className="bg-green-800 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-medium">
              {t('register_success')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-medium">
              {t('register_error')}
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">

          {/* Inputs */}
          {[
            { label: t('full_name'), key: 'name', placeholder: 'Ali Hassan', type: 'text' },
            { label: t('org_name'), key: 'organization', placeholder: 'Red Cross, Helping Hands', type: 'text' },
            { label: t('email_label'), key: 'email', placeholder: 'ali@email.com', type: 'email' },
            { label: t('whatsapp'), key: 'phone', placeholder: '+91 9876543210', type: 'tel' },
            { label: t('city'), key: 'location', placeholder: 'Hyderabad', type: 'text' }
          ].map(f => (
            <div key={f.key}>
              <label className="text-gray-400 text-xs font-bold uppercase mb-2 block">
                {f.label}
              </label>

              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.value })
                }
                placeholder={f.placeholder}
                className={inputClass}
              />
            </div>
          ))}

          {/* Skills */}
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">
              {t('skills_label')}
            </label>

            <div className="flex flex-wrap gap-2">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    form.skills.includes(skill)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? t('registering') : t('register_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Volunteer