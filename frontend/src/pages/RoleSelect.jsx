import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

function RoleSelect() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6 relative">
      
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold mb-3">{t('welcome')}</h1>
        <p className="text-gray-400 mb-10">{t('choose_role')}</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div
            onClick={() => { localStorage.setItem("role", "volunteer"); navigate('/my-tasks') }}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 rounded-2xl p-8 cursor-pointer transition-all"
          >
            <h2 className="text-2xl font-bold mb-2">{t('volunteer_card')}</h2>
            <p className="text-gray-400 text-sm">{t('volunteer_desc')}</p>
          </div>

          <div
            onClick={() => { localStorage.setItem("role", "ngo"); navigate('/login') }}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 rounded-2xl p-8 cursor-pointer transition-all"
          >
            <h2 className="text-2xl font-bold mb-2">{t('ngo_card')}</h2>
            <p className="text-gray-400 text-sm">{t('ngo_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSelect