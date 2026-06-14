import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'te', label: 'తె' },
  { code: 'ta', label: 'த' },
  { code: 'mr', label: 'म' },
  { code: 'bn', label: 'বা' },
  { code: 'ur', label: 'اُر' },
]

function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex gap-1 flex-wrap">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={"text-xs px-2 py-1 rounded font-medium transition-colors " + (
            i18n.language === lang.code
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
