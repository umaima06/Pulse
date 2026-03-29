import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const links = [
    { path: '/dashboard', label: '🗺️ Dashboard' },
    { path: '/reports', label: '📋 Reports' },
    { path: '/tasks', label: '✅ Tasks' },
    { path: '/volunteers', label: '👥 Volunteers' },
    { path: '/intake', label: '📝 Intake' },
    { path: '/volunteer', label: '🙋 Register' },
    { path: '/my-tasks', label: '📌 My Tasks' },
  ]

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
      <Link to="/" className="text-2xl font-bold text-orange-400">⚡ PULSE</Link>
      <div className="flex gap-4 overflow-x-auto items-center">
        {links.map(link => (
          <Link key={link.path} to={link.path}
            className={`text-sm font-medium transition-colors whitespace-nowrap ${
              location.pathname === link.path
                ? 'text-orange-400 border-b-2 border-orange-400 pb-1'
                : 'text-gray-300 hover:text-white'
            }`}>
            {link.label}
          </Link>
        ))}
        <button onClick={handleLogout}
          className="text-sm text-red-400 hover:text-red-300 ml-2 whitespace-nowrap">
          Logout
        </button>
      </div>
    </div>
  )
}

export default Navbar