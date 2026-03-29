import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Navbar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-orange-400">⚡ PULSE</h1>
        <div className="flex gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white text-sm px-4 py-2">Login</Link>
          <Link to="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg font-medium">Get Started</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-red-900 text-red-300 text-xs px-3 py-1 rounded-full mb-6 font-medium">
          🔴 LIVE — 5 active crises detected
        </div>
        <h2 className="text-6xl font-black mb-6 leading-tight">
          AI-Powered Crisis Response<br />
          <span className="text-orange-400">for NGOs</span>
        </h2>
        <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
          PULSE collects scattered community data, identifies the most urgent needs,
          and dispatches volunteers — automatically, in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
            View Dashboard →
          </Link>
          <a href="#how" className="border border-gray-600 hover:border-gray-400 text-gray-300 font-medium px-8 py-4 rounded-xl text-lg transition-all">
            How it works
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-4xl font-black text-orange-400">30s</p>
            <p className="text-gray-400 mt-2">WhatsApp → Crisis Alert</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-4xl font-black text-orange-400">100%</p>
            <p className="text-gray-400 mt-2">Auto volunteer matching</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-4xl font-black text-orange-400">0</p>
            <p className="text-gray-400 mt-2">Manual coordination needed</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how" className="max-w-4xl mx-auto px-8 pb-24">
        <h3 className="text-3xl font-bold text-center mb-12">How PULSE Works</h3>
        <div className="grid grid-cols-1 gap-4">
          {[
            { step: '01', title: 'Field worker sends WhatsApp', desc: 'Any language, voice or text — PULSE understands it all', icon: '📱' },
            { step: '02', title: 'AI analyzes & scores urgency', desc: 'Groq AI extracts need type, location, urgency score in seconds', icon: '🤖' },
            { step: '03', title: 'Reports cluster automatically', desc: 'Nearby same-type reports group into one crisis cluster', icon: '📍' },
            { step: '04', title: 'Volunteer auto-dispatched', desc: 'Best matching volunteer gets WhatsApp notification instantly', icon: '🚀' },
          ].map(item => (
            <div key={item.step} className="bg-gray-800 rounded-xl p-5 flex items-center gap-5">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-white font-bold">{item.title}</p>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
              <span className="text-orange-400 font-black text-2xl">{item.step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-8 py-6 text-center">
        <p className="text-gray-500 text-sm">⚡ PULSE — Built for NGOs. Powered by AI.</p>
      </div>
    </div>
  )
}

export default Landing