import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import te from './locales/te.json'
import ta from './locales/ta.json'
import mr from './locales/mr.json'
import bn from './locales/bn.json'
import ur from './locales/ur.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en},
    hi: { translation: hi },
    te: { translation: te },
    ta: { translation: ta },
    mr: { translation: mr },
    bn: { translation: bn },
    ur: { translation: ur },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
