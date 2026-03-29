import { useState } from 'react'
import Navbar from '../components/Navbar'

function Intake() {
  const [form, setForm] = useState({
    message: '', location: '', need_type: '', urgency_raw: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const needTypes = ['medical', 'food', 'water', 'shelter', 'rescue', 'education', 'other']

  const handleSubmit = async () => {
    if (!form.message || !form.location) { setStatus('error'); return }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/incoming-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Body: `${form.need_type}: ${form.message} Location: ${form.location}`, From: 'NGO_DIRECT' })
      })
      if (res.ok) { setStatus('success'); setForm({ message: '', location: '', need_type: '', urgency_raw: '' }) }
      else setStatus('error')
    } catch { setStatus('error') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Manual Report Intake</h2>
        <p className="text-gray-400 mb-8">NGO coordinator can directly log a crisis report</p>

        {status === 'success' && (
          <div className="bg-green-800 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-medium">✅ Report submitted! AI will analyze and cluster it.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-medium">❌ Please fill message and location.</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Need Type</label>
            <div className="flex flex-wrap gap-2">
              {needTypes.map(type => (
                <button key={type} onClick={() => setForm({...form, need_type: type})}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.need_type === type ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-400'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Location *</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              placeholder="Village name, District, State"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Report Message *</label>
            <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              placeholder="Describe the crisis situation in detail..."
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 resize-none" />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {loading ? 'Submitting...' : 'Submit Report →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Intake