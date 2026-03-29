import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    if (form.email === 'ngo@pulse.ai' && form.password === 'pulse123') {
      setTimeout(() => navigate('/dashboard'), 500)
    } else {
      setError('Invalid credentials. Use ngo@pulse.ai / pulse123')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <Link to="/" className="text-3xl font-black text-orange-400 mb-10">⚡ PULSE</Link>
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
        <p className="text-gray-400 text-sm mb-8">Sign in to your NGO dashboard</p>
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-5">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="ngo@pulse.ai"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400" />
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-gray-300 text-xs">🔑 Demo credentials:</p>
            <p className="text-orange-400 text-xs font-mono">ngo@pulse.ai / pulse123</p>
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mt-6">
        Are you a volunteer?{' '}
        <Link to="/volunteer" className="text-orange-400 hover:underline">Register here</Link>
      </p>
    </div>
  )
}

export default Login