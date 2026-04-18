import { useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle } from "lucide-react"

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi, I’m PULSE AI. How can I help?" }
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)
  const whatsappLink = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER.replace('+', '')}`
  const navigate = useNavigate()

  // 🔽 auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMsg = { from: "user", text: input }
    setMessages(prev => [...prev, userMsg])

    setInput("")

    // ⏳ loading feel
    const loadingMsg = { from: "bot", text: "⚡ Thinking..." }
    setMessages(prev => [...prev, loadingMsg])

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input
        })
      })

      const data = await res.json()

      // remove loading + add real reply
      setMessages(prev => {
        const updated = prev.slice(0, -1)
        return [
          ...updated,
          {
            from: "bot",
            text: data.reply,
            actions: data.actions || []
          }
        ]
      })

    } catch (err) {
      setMessages(prev => {
        const updated = prev.slice(0, -1)
        return [
          ...updated,
          { from: "bot", text: "⚠️ Server error. Try again." }
        ]
      })
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
  onClick={() => setOpen(!open)}
  className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all"
>
  <MessageCircle size={22} />
</button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 right-6 w-80 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.2)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-500 px-4 py-3 font-bold text-white">
              ⚡ PULSE AI
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className="space-y-1">
                  
                  <div
                    className={`text-sm px-3 py-2 rounded-lg max-w-[75%] ${
                      msg.from === "user"
                        ? "bg-emerald-500 ml-auto text-white"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* ACTION BUTTONS */}
{msg.actions?.length > 0 &&
  msg.actions.map((btn, i) => (
   <button
  key={i}
  onClick={() => {
    if (btn.link.includes("/intake")) {
      const url = new URL(btn.link)
      navigate(url.pathname + url.search)
    } else {
      window.open(btn.link, "_blank")
    }
  }}
  className="block w-full bg-emerald-500 text-white text-center mt-2 px-3 py-1 rounded hover:bg-emerald-600 text-xs"
>
  {btn.label}
</button>
  ))
}

                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Help Section */}
        <div className="px-3 py-2 border-t border-white/10 text-xs text-gray-400 text-center">
  Need help? Use WhatsApp or report a problem above 👆
</div>
{/* Quick Actions */}
<div className="flex gap-2 p-3 flex-wrap border-t border-white/10 bg-black/20">
  <button 
    onClick={() => setInput("Report a problem")} 
    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-md transition-all"
  >
    🚨 Report
  </button>

  <button 
    onClick={() => setInput("How does PULSE work")} 
    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-md transition-all"
  >
    🤖 About
  </button>

  <button 
    onClick={() => setInput("How many people helped")} 
    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-md transition-all"
  >
    📊 Stats
  </button>
</div>

            {/* Input */}
            <div className="flex border-t border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-transparent text-white px-3 py-2 outline-none text-sm"
                placeholder="Type message..."
              />
              <button
                onClick={sendMessage}
                className="px-4 text-emerald-400 hover:text-white"
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot