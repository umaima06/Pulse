import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  if (user === undefined) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
