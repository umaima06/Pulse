import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, googleProvider } from '../firebase'
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleEmailAuth = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, form.email, form.password)
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, ''))
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      setError('Google sign in failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <Link to="/" className="text-3xl font-black text-orange-400 mb-10">⚡ PULSE</Link>

      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-2">
          {isRegister ? 'Create NGO Account' : 'Welcome back'}
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          {isRegister ? 'Register your NGO to access PULSE' : 'Sign in to your NGO dashboard'}
        </p>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-5">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Google Button */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 mb-4">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.7 39.7 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="ngo@organization.com"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
              placeholder="••••••••"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400" />
          </div>

          <button onClick={handleEmailAuth} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg">
            {loading ? 'Please wait...' : isRegister ? 'Create Account →' : 'Sign In →'}
          </button>
        </div>

        <button onClick={() => { setIsRegister(!isRegister); setError('') }}
          className="w-full text-center text-gray-400 hover:text-white text-sm mt-4 transition-colors">
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </div>

      <p className="text-gray-500 text-sm mt-6">
        Are you a volunteer?{' '}
        <Link to="/volunteer" className="text-orange-400 hover:underline">Register here instead</Link>
      </p>
    </div>
  )
}

export default Login