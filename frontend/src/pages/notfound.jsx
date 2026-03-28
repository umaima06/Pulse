import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-8xl font-bold text-orange-400">404</p>
        <p className="text-gray-400 mt-4 text-xl">Page not found</p>
        <Link to="/" className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound