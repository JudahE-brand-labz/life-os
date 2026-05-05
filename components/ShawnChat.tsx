'use client'

import { useRef, useState } from 'react'
import { sendMessage } from '@/lib/shawn'

interface Message {
  role: 'user' | 'shawn'
  text: string
}

export default function ShawnChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const response = await sendMessage(text)
    setMessages(prev => [...prev, { role: 'shawn', text: response }])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-6 flex flex-col rounded-xl border border-zinc-800 shadow-2xl"
          style={{ width: '400px', height: '500px', backgroundColor: '#1a1a1a', zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-zinc-100 font-medium">Shawn</span>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.length === 0 && (
              <p className="text-zinc-600 text-sm text-center mt-4">
                Say something to Shawn...
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'self-end text-zinc-100 bg-zinc-700'
                    : 'self-start text-zinc-300 bg-zinc-800'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="self-start px-3 py-2 rounded-lg text-sm text-zinc-600 bg-zinc-800">
                thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-zinc-800">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message Shawn..."
              className="flex-1 bg-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-2 outline-none placeholder:text-zinc-600"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ backgroundColor: '#CC785C' }}
              className="px-3 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ backgroundColor: '#CC785C', zIndex: 50 }}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full text-white text-xl font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
        aria-label="Open Shawn chat"
      >
        S
      </button>
    </>
  )
}
