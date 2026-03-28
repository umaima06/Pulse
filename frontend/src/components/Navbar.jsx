import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  const links = [
    { path: '/', label: '🗺️ Dashboard' },
    { path: '/reports', label: '📋 Reports' },
    { path: '/tasks', label: '✅ Tasks' },
    { path: '/volunteers', label: '👥 Volunteers' },
    { path: '/volunteer', label: '🙋 Register' },
  ]
  return (
    <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
      <h1 className="text-2xl font-bold text-orange-400">⚡ PULSE</h1>
      <div className="flex gap-6">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium transition-colors ${
              location.pathname === link.path
                ? 'text-orange-400 border-b-2 border-orange-400 pb-1'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Navbar