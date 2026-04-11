import { useNavigate } from 'react-router-dom'

function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="max-w-4xl w-full text-center">
        
        <h1 className="text-4xl font-bold mb-3">Welcome to PULSE</h1>
        <p className="text-gray-400 mb-10">Choose how you want to continue</p>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Volunteer */}
          <div
            onClick={() => {
              localStorage.setItem("role", "volunteer")
              navigate('/my-tasks')
            }}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 rounded-2xl p-8 cursor-pointer transition-all"
          >
            <h2 className="text-2xl font-bold mb-2">🙋 Volunteer</h2>
            <p className="text-gray-400 text-sm">
              Help people in crisis, receive tasks, and make impact.
            </p>
          </div>

          {/* NGO */}
          <div
            onClick={() => {
              localStorage.setItem("role", "ngo")
              navigate('/login')
            }}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 rounded-2xl p-8 cursor-pointer transition-all"
          >
            <h2 className="text-2xl font-bold mb-2">🏢 NGO Admin</h2>
            <p className="text-gray-400 text-sm">
              Monitor crises, manage volunteers, and deploy resources.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default RoleSelect