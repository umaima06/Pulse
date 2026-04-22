import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

function Landing() {

  // ─── Live counters ───────────────────────────────────────────────────────────
  const [people, setPeople]         = useState(0)
  const [volunteers, setVolunteers] = useState(0)
  const [resolved, setResolved]     = useState(0)

  // ─── Live events feed ────────────────────────────────────────────────────────
  const [events, setEvents] = useState([])

  // ─── Voice AI simulation ─────────────────────────────────────────────────────
  const [callActive, setCallActive] = useState(false)
  const [callText, setCallText]     = useState('')

  // ─── WhatsApp chat simulation ────────────────────────────────────────────────
  const [chat, setChat] = useState([])

  const { t } = useTranslation()

  // ─── Live counter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    let p = 0, v = 0, r = 0
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 50)
      v += Math.floor(Math.random() * 3)
      r += Math.floor(Math.random() * 2)
      setPeople(p)
      setVolunteers(v)
      setResolved(r)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // ─── Live events feed effect ──────────────────────────────────────────────────
  useEffect(() => {
    const messages = [
      'Flood alert detected in Hyderabad',
      'Food request processed in Mumbai',
      'Medical emergency flagged in Delhi',
      'Volunteer dispatched in Bangalore',
      'New crisis cluster formed in Chennai',
    ]
    const interval = setInterval(() => {
      const newEvent = messages[Math.floor(Math.random() * messages.length)]
      setEvents(prev => [newEvent, ...prev.slice(0, 4)])
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // ─── WhatsApp simulation effect ───────────────────────────────────────────────
  useEffect(() => {
    const msgs = [
      'Need food in Secunderabad',
      'Water rising rapidly here',
      'Medical help required urgently',
      'Children stranded in area',
    ]
    const interval = setInterval(() => {
      const msg = msgs[Math.floor(Math.random() * msgs.length)]
      setChat(prev => [...prev.slice(-3), msg])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // ─── Voice AI simulation ──────────────────────────────────────────────────────
  const startCall = () => {
    setCallActive(true)
    const script = [
      '📞 Connecting to PULSE AI...',
      '🎤 Listening...',
      '🧠 Analyzing voice input...',
      '🚨 Flood emergency detected',
      '📍 Location identified: Hyderabad',
      '🚀 Dispatching volunteer...',
    ]
    let i = 0
    const interval = setInterval(() => {
      setCallText(script[i])
      i++
      if (i >= script.length) clearInterval(interval)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white animate-fadeIn">

   {/* ── Navbar ─────────────────────────────────────────────────────────── */}
  <div className="flex flex-col px-8 py-5 border-b border-white/10">
  
    {/* TOP ROW */}
    <div className="flex items-center justify-between w-full">
      
      {/* LEFT: Logo */}
      <h1 className="text-2xl font-bold text-emerald-400">
        ⚡ {t('brand')}
      </h1>
      
      {/* RIGHT: Login + Get Started */}
      <div className="flex items-center gap-3">
        <Link
        to="/get-started"
        className="text-gray-300 hover:text-white text-sm px-4 py-2 transition-colors"
        >
          {t('nav_login')}
        </Link>
        <Link
        to="/get-started"
        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          {t('nav_get_started')}
        </Link>
      </div>
    </div>

  {/* BOTTOM ROW: Languages */}
  <div className="mt-3 flex justify-center">
    <LanguageSwitcher />
  </div>

</div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <motion.div
        className="max-w-5xl mx-auto px-8 py-20 text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-red-900/50 border border-red-700 text-red-300 text-xs px-4 py-2 rounded-full mb-8 font-medium">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block"></span>
          {t('hero_badge')}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 opacity-20 blur-3xl pointer-events-none pulse-bg"></div>
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              {t('hero_title1')}<br />
              <span className="text-emerald-400">{t('hero_title2')}</span>
            </h2>
          </div>
        </div>

        <p className="text-gray-400 mt-2 flex items-center justify-center gap-1 mb-4">
          {t('hero_sub')}
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </p>

        <p className="typing text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero_desc')}
        </p>

        <p className="text-xs text-gray-500 mb-6">{t('hero_realtime')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={startCall}
            className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {t('ivr_btn')}
          </button>

          <Link
            to="/get-started"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            {t('nav_get_started')}
          </Link>

          <button
            onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
            className="border border-gray-600 hover:border-orange-400 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl text-lg transition-all flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
          >
            {t('how_btn')}
          </button>
        </div>

        {/* Voice AI UI */}
        {callActive && (
          <div className="mt-8 bg-black/40 border border-emerald-500 rounded-xl p-4 text-center animate-fadeIn">
            <p className="text-emerald-400 font-medium">{callText}</p>
          </div>
        )}
      </motion.div>

      {/* ── Problem Statement ───────────────────────────────────────────────── */}
      <motion.div
        className="max-w-5xl mx-auto px-8 py-20 text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h3 className="text-3xl md:text-4xl font-bold mb-6">
          {t('problem_title1')}
          <span className="text-red-400"> {t('problem_title2')}</span>
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
          {t('problem_desc')}
        </p>
      </motion.div>

      {/* ── So we built PULSE ───────────────────────────────────────────────── */}
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h3 className="text-4xl font-black">
          {t('built_title')} <span className="text-emerald-400">{t('brand')}</span>
        </h3>
        <p className="text-gray-400 mt-4">{t('built_sub')}</p>
      </motion.div>

      {/* ── Live Impact Counter ─────────────────────────────────────────────── */}
      <motion.div
        className="max-w-4xl mx-auto px-8 pb-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <p className="text-gray-300 text-sm font-medium">{t('live_impact')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-5xl font-black text-emerald-400">{people.toLocaleString()}</p>
              <p className="text-gray-400 mt-2 text-sm">{t('people_reached')}</p>
            </div>
            <div>
              <p className="text-5xl font-black text-green-400">{volunteers}</p>
              <p className="text-gray-400 mt-2 text-sm">{t('volunteers_deployed')}</p>
            </div>
            <div>
              <p className="text-5xl font-black text-blue-400">{resolved}</p>
              <p className="text-gray-400 mt-2 text-sm">{t('crises_resolved')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Static Stats ────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: '30s',  labelKey: 'stat1_label' },
            { value: '100%', labelKey: 'stat2_label' },
            { value: '0',    labelKey: 'stat3_label' },
          ].map(stat => (
            <div
              key={stat.labelKey}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
            >
              <p className="text-4xl font-black text-emerald-400">{stat.value}</p>
              <p className="text-gray-400 mt-2 text-sm">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <motion.div
        id="how"
        className="max-w-4xl mx-auto px-8 pb-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h3 className="text-3xl font-bold text-center mb-4">{t('how_title')}</h3>
        <p className="text-gray-400 text-center mb-12">{t('how_sub')}</p>

        <div className="space-y-6 relative">
          {[
            { step: '01', titleKey: 'step1_title', descKey: 'step1_desc', icon: '📱', color: 'border-blue-700' },
            { step: '02', titleKey: 'step2_title', descKey: 'step2_desc', icon: '🤖', color: 'border-purple-700' },
            { step: '03', titleKey: 'step3_title', descKey: 'step3_desc', icon: '📍', color: 'border-orange-700' },
            { step: '04', titleKey: 'step4_title', descKey: 'step4_desc', icon: '🚀', color: 'border-green-700' },
          ].map(item => (
            <div
              key={item.step}
              className={`relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 flex items-center gap-5 border-l-4 ${item.color} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95`}
            >
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400 via-gray-700 to-transparent animate-pulse"></div>
              <div className="absolute left-5 top-5 w-3 h-3 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent pointer-events-none"></div>
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-white font-bold">{t(item.titleKey)}</p>
                <p className="text-gray-400 text-sm mt-1">{t(item.descKey)}</p>
              </div>
              <span className="text-emerald-400 font-black text-2xl opacity-50">{item.step}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Why PULSE ───────────────────────────────────────────────────────── */}
      <motion.div
        className="max-w-5xl mx-auto px-8 py-20"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h3 className="text-3xl font-bold text-center mb-12">{t('why_title')}</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { titleKey: 'why1_title', descKey: 'why1_desc' },
            { titleKey: 'why2_title', descKey: 'why2_desc' },
            { titleKey: 'why3_title', descKey: 'why3_desc' },
          ].map(item => (
            <div
              key={item.titleKey}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
            >
              <p className="text-emerald-400 font-bold mb-2">{t(item.titleKey)}</p>
              <p className="text-gray-400 text-sm">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-8 pb-24">
        <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-2xl p-10 text-center border border-orange-700/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-3xl font-bold mb-4">{t('cta_title')}</h3>
          <p className="text-gray-300 mb-6">{t('cta_sub')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/get-started"
              className="bg-white text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-all inline-block hover:scale-105 active:scale-95"
            >
              {t('cta_btn1')}
            </Link>
            <Link
              to="/get-started"
              className="border border-gray-600 hover:border-orange-400 text-gray-300 hover:text-white font-medium px-8 py-3 rounded-xl text-lg transition-all inline-block hover:scale-105 active:scale-95"
            >
              {t('cta_btn2')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-8 py-6 text-center">
        <p className="text-gray-500 text-sm">{t('footer')}</p>
      </div>

    </div>
  )
}

export default Landing
