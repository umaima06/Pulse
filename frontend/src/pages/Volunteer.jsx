import { useState } from 'react'
import Navbar from '../components/Navbar'

function Volunteer() {
  const [form, setForm] = useState({ 
    name: '', email: '', phone: '', location: '', 
    skills: [], organization: '' 
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const skillOptions = ['medical', 'food', 'water', 'shelter', 'rescue', 'transport', 'education']

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
      setStatus('error'); return
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
        setForm({ name: '', email: '', phone: '', location: '', skills: [], organization: '' })
      } else setStatus('error')
    } catch { setStatus('error') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Register as Volunteer</h2>
        <p className="text-gray-400 mb-8">Join PULSE to help communities in crisis</p>

        {status === 'success' && (
          <div className="bg-green-800 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-medium">✅ Registered! You will receive WhatsApp alerts.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-medium">❌ Fill all fields and select at least one skill.</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Ali Hassan"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Organization / NGO Name</label>
            <input type="text" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})}
              placeholder="Red Cross, Helping Hands, etc."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="ali@email.com"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">WhatsApp Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="+91 9876543210"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Your City/Location *</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              placeholder="Hyderabad, Telangana"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-2 block">Skills * (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map(skill => (
                <button key={skill} onClick={() => toggleSkill(skill)}
                  className={"px-4 py-2 rounded-full text-sm font-medium border transition-all " + (
                    form.skills.includes(skill) 
                      ? 'bg-orange-500 border-orange-500 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-400'
                  )}>
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {loading ? 'Registering...' : 'Register as Volunteer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Volunteer