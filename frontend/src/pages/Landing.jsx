import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Landing() {
  const [stats, setStats] = useState(null)

  const startCall = async () => {
    try {
      await fetch("http://localhost:3000/start-call", {
        method: "POST",
      })
      alert("📞 Call initiated!")
    } catch (err) {
      console.error(err)
      alert("Call failed ")
    }
  }

  useEffect(() => {
    fetch('http://localhost:3000/analytics')
      .then(r => r.json())
      .then(data => setStats(data.analytics))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">

      {/* Navbar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-emerald-400">⚡ PULSE</h1>
        <div className="flex gap-4">
          <Link to="/get-started" className="text-gray-300 hover:text-white text-sm px-4 py-2 transition-colors">Login</Link>
          <Link to="/get-started" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all">Get Started →</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 py-20 text-center animate-fadeIn">
        <div className="inline-flex items-center gap-2 bg-red-900 bg-opacity-50 border border-red-700 text-red-300 text-xs px-4 py-2 rounded-full mb-8 font-medium">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block"></span>
          LIVE — AI monitoring active across India
        </div>

        <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Crisis Response,<br />
          <span className="text-emerald-400">Powered by AI</span>
        </h2>

        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          PULSE collects scattered community data, identifies the most urgent needs,
          and dispatches volunteers automatically — in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <button
            onClick={startCall}
            className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 shadow-glow text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105"
          >
            📞 Emergency Call (IVR Simulation)
          </button>

          <Link to="/get-started" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105">
          Get Started →
          </Link>

          <a href="#how" className="border border-gray-600 hover:border-orange-400 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl text-lg transition-all">
            How it works
          </a>
        </div>
      </div>

      <div className="mt-16 relative">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 hover:scale-[1.01] transition-all duration-300">
          <p className="text-sm text-gray-400 mb-2">Live Crisis Map Preview</p>
          <div className="h-48 bg-black rounded-lg flex items-center justify-center text-gray-500">
            🌍 Map Loading...
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-20 text-center animate-fadeIn">
        <h3 className="text-3xl md:text-4xl font-bold mb-6">
          When crisis hits, response is
          <span className="text-red-400"> slow, scattered, and chaotic</span>
        </h3>
          
        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Field workers send messages. NGOs scramble to respond.
          Critical needs get buried. Lives are lost — not due to lack of help,
          but lack of coordination.
        </p>
      </div>

      <div className="text-center py-16 animate-fadeIn">
        <h3 className="text-4xl font-black">
          <div className="text-center py-16 animate-fadeIn">
            So we built <span className="text-emerald-400">PULSE</span>
          </div>
        </h3>
        <p className="text-gray-400 mt-4">
          An AI system that turns chaos into coordinated action — instantly
        </p>
      </div>

      {/* Live Impact Counter */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <div className="max-w-4xl mx-auto px-8 pb-16 animate-fadeIn">
              <p className="text-gray-300 text-sm font-medium">LIVE IMPACT — Updated in real time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-5xl font-black text-emerald-400">
                {stats ? ((stats.reports?.total_affected ?? 0)).toLocaleString() : '—'}
              </p>
              <p className="text-gray-400 mt-2 text-sm">People reached</p>
            </div>

            <div>
              <p className="text-5xl font-black text-green-400">
                {stats ? (stats.volunteers?.total ?? 0) : '—'}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Volunteers deployed</p>
            </div>

            <div>
              <p className="text-5xl font-black text-blue-400">
                {stats ? (stats.tasks?.done ?? 0) : '—'}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Crises resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Static Stats */}
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: '30s', label: 'WhatsApp → Crisis Alert' },
            { value: '100%', label: 'Auto volunteer matching' },
            { value: '0', label: 'Manual coordination needed' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-800 hover:bg-gray-750 rounded-2xl p-6 text-center border border-gray-700 hover:border-orange-500 transition-all duration-300 hover:scale-[1.02]">
              <p className="text-4xl font-black text-emerald-400">{stat.value}</p>
              <p className="text-gray-400 mt-2 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="how" className="max-w-4xl mx-auto px-8 pb-24 animate-fadeIn">
        <h3 className="text-3xl font-bold text-center mb-4">How PULSE Works</h3>
        <p className="text-gray-400 text-center mb-12">From WhatsApp message to volunteer deployed in under 60 seconds</p>

        <div className="space-y-6">
          {[
            { step: '01', title: 'Field worker sends WhatsApp', desc: 'Any language, voice or text — PULSE understands it all', icon: '📱', color: 'border-blue-700' },
            { step: '02', title: 'AI analyzes and scores urgency', desc: 'Groq AI extracts need type, location, urgency score in seconds', icon: '🤖', color: 'border-purple-700' },
            { step: '03', title: 'Reports cluster automatically', desc: 'Nearby same-type reports group into one crisis cluster on the map', icon: '📍', color: 'border-orange-700' },
            { step: '04', title: 'Volunteer auto-dispatched', desc: 'Best matching volunteer gets WhatsApp + SMS notification instantly', icon: '🚀', color: 'border-green-700' },
          ].map(item => (
            <div key={item.step} className={"relative bg-gray-800 rounded-xl p-5 flex items-center gap-5 border-l-4 " + item.color + " hover:scale-[1.02] transition-all duration-300"}>
              {/* 🔥 vertical pipeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-700"></div>
              <div className={"bg-gray-800 rounded-xl p-5 flex items-center gap-5 border-l-4 transition-all duration-300 hover:scale-[1.02] " + item.color}>
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-bold">{item.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                </div>
                <span className="text-emerald-400 font-black text-2xl opacity-50">{item.step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-20 animate-fadeIn">
        <h3 className="text-3xl font-bold text-center mb-12">Why PULSE is different</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {title: "AI-first",desc: "Understands natural language, urgency, and location instantly"},
            {title: "Real-time", desc: "No dashboards to refresh — everything updates live"},
            {title: "Zero coordination", desc: "Volunteers are matched and deployed automatically"}
          ].map(item => (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 hover:scale-[1.01] transition-all duration-300">
              <p className="text-emerald-400 font-bold mb-2">{item.title}</p>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-8 pb-24">
        <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-2xl p-10 text-center border border-orange-700 hover:scale-[1.02] transition-all duration-300">
          <h3 className="text-3xl font-bold mb-4">Ready to respond faster?</h3>
          <p className="text-gray-300 mb-6">Join NGOs using PULSE to save lives with AI</p>
          <Link to="/get-started" className="bg-white text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-all inline-block">
          Get Started Free →
          </Link>
          <Link to="/get-started" className="border border-gray-600 hover:border-orange-400 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl text-lg transition-all">
          Join as Volunteer
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-8 py-6 text-center">
        <p className="text-gray-500 text-sm">⚡ PULSE — Built for NGOs. Powered by AI. Built with Google Firebase + Groq.</p>
      </div>
    </div>
  )
}

export default Landing