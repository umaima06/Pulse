import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const { t } = useTranslation()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return () => unsub()
  }, [])

  const links = [
    { path: '/dashboard', label: `🗺️ ${t('dashboard')}` },
    { path: '/reports',   label: `📋 ${t('reports')}` },
    { path: '/tasks',     label: `✅ ${t('tasks')}` },
    { path: '/volunteers',label: `👥 ${t('volunteers')}` },
    { path: '/analytics', label: `📊 ${t('analytics')}` },
    { path: '/intake',    label: `📝 ${t('intake')}` },
    { path: '/volunteer', label: `🙋 ${t('register')}` },
    { path: '/my-tasks',  label: `📌 ${t('my_tasks')}` },
  ]

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 relative z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-2xl font-bold text-orange-400">⚡ PULSE</Link>
          {user?.displayName && (
            <span className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded-lg hidden sm:block">
              {user.displayName}
            </span>
          )}
        </div>

        {/* Desktop links + language switcher */}
        <div className="hidden lg:flex gap-4 items-center">
          {links.map(link => (
            <Link key={link.path} to={link.path}
              className={"text-sm font-medium transition-colors whitespace-nowrap " + (
                location.pathname === link.path
                  ? 'text-orange-400 border-b-2 border-orange-400 pb-1'
                  : 'text-gray-300 hover:text-white'
              )}>
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 ml-2">
            {t('logout')}
          </button>
          <div className="border-l border-gray-600 pl-3 ml-1">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-gray-300 hover:text-white p-2 text-xl">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-gray-800 border-t border-gray-700 px-6 py-4 flex flex-col gap-3">
          {user?.displayName && (
            <p className="text-orange-400 text-sm font-medium pb-2 border-b border-gray-700">{user.displayName}</p>
          )}
          <div className="pb-2 border-b border-gray-700">
            <LanguageSwitcher />
          </div>
          {links.map(link => (
            <Link key={link.path} to={link.path}
              onClick={() => setMenuOpen(false)}
              className={"text-sm font-medium py-2 border-b border-gray-700 " + (
                location.pathname === link.path ? 'text-orange-400' : 'text-gray-300'
              )}>
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-sm text-red-400 text-left py-2">
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  )
}

export default Navbar
