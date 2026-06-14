import { useState, useEffect } from 'react'
import VapiModule from '@vapi-ai/web'
const Vapi = VapiModule.default || VapiModule

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID

let vapiInstance = null
function getVapi() {
  if (!vapiInstance) vapiInstance = new Vapi(VAPI_PUBLIC_KEY)
  return vapiInstance
}

export default function VoiceAgent() {
  const [status, setStatus] = useState('idle')
  const [agentText, setAgentText] = useState('')

  useEffect(() => {
    const vapi = getVapi()
    vapi.on('call-start', () => {
      setStatus('active')
      setAgentText('Listening... speak your report.')
    })
    vapi.on('message', (msg) => {
      if (msg.type === 'transcript' && msg.role === 'assistant') {
        setAgentText(msg.transcript)
      }
    })
    vapi.on('call-end', () => {
      setStatus('done')
      setAgentText('Report submitted. Check the NGO dashboard.')
    })
    vapi.on('error', () => setStatus('idle'))
    return () => vapi.removeAllListeners()
  }, [])

  const startCall = async () => {
    try {
      setStatus('connecting')
      await getVapi().start(ASSISTANT_ID)
    } catch {
      setStatus('idle')
    }
  }

  const endCall = () => {
    getVapi().stop()
    setStatus('processing')
  }

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-gray-900/80 
                    border border-white/10 rounded-2xl w-full max-w-xs mx-auto">
      <div className="text-center">
        <p className="text-white font-semibold">🎙️ PULSE Voice Agent</p>
        <p className="text-gray-400 text-xs mt-1">
          Speak in Hindi, Telugu, Tamil, or English
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'active'     ? 'bg-red-400 animate-pulse' :
          status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          status === 'done'       ? 'bg-emerald-400' : 'bg-gray-500'
        }`} />
        <span className="text-gray-300 text-sm">
          {status === 'idle'       && 'Ready'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'active'     && 'Agent active'}
          {status === 'processing' && 'Submitting...'}
          {status === 'done'       && 'Report submitted'}
        </span>
      </div>

      {agentText && (
        <div className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 
                        rounded-xl text-emerald-300 text-sm text-center">
          {agentText}
        </div>
      )}

      {(status === 'idle' || status === 'done') && (
        <button
          onClick={status === 'done' 
            ? () => { setStatus('idle'); setAgentText('') } 
            : startCall}
          className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500
                     flex items-center justify-center text-3xl transition-all
                     shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
        >
          {status === 'done' ? '🔄' : '🎙️'}
        </button>
      )}

      {status === 'active' && (
        <button
          onClick={endCall}
          className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500
                     flex items-center justify-center text-3xl transition-all
                     animate-pulse active:scale-95"
        >
          ⏹️
        </button>
      )}

      {(status === 'connecting' || status === 'processing') && (
        <div className="w-20 h-20 rounded-full bg-gray-700 border border-white/10
                        flex items-center justify-center text-3xl">
          ⏳
        </div>
      )}

      <p className="text-gray-500 text-xs text-center">
        {status === 'idle'   && 'Tap mic. Describe the crisis naturally.'}
        {status === 'active' && 'Tap stop when finished speaking.'}
        {status === 'done'   && 'Tap to report another crisis.'}
      </p>
    </div>
  )
}