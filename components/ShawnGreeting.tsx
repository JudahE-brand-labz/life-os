'use client'

import { useEffect, useRef, useState } from 'react'
import { sendMessage } from '@/lib/shawn'

interface Message {
  role: 'user' | 'shawn'
  text: string
}

export default function ShawnGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    sendMessage(
      `Good ${timeOfDay}. Brief me — what needs my attention today? Check my calendar, tasks, and goals. Keep it short.`
    ).then(response => {
      if (cancelled) return
      setGreeting(response)
      setMessages([{ role: 'shawn', text: response }])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setSending(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const response = await sendMessage(text)
    setMessages(prev => [...prev, { role: 'shawn', text: response }])
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="mt-6 rounded-lg border border-zinc-800 overflow-hidden"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: loading ? '#52525b' : '#CC785C' }}
          />
          <span className="text-sm font-medium text-zinc-200">Shawn</span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? 'collapse' : 'chat'}
        </button>
      </div>

      {/* Greeting preview (always visible) */}
      <div className="px-5 py-4">
        {loading ? (
          <p className="text-sm text-zinc-600 italic">Shawn is thinking...</p>
        ) : (
          <p className="text-sm text-zinc-300 leading-relaxed">{greeting}</p>
        )}
      </div>

      {/* Expanded chat */}
      {expanded && (
        <>
          {/* Message history (skip first message — already shown above) */}
          {messages.length > 1 && (
            <div className="px-5 pb-3 flex flex-col gap-3 max-h-72 overflow-y-auto border-t border-zinc-800 pt-3">
              {messages.slice(1).map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'self-end text-zinc-100 bg-zinc-700 ml-auto'
                      : 'self-start text-zinc-300 bg-zinc-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {sending && (
                <div className="self-start px-3 py-2 rounded-lg text-sm text-zinc-600 bg-zinc-800">
                  thinking...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-zinc-800">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tell Shawn something..."
              className="flex-1 bg-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-2 outline-none placeholder:text-zinc-600"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{ backgroundColor: '#CC785C' }}
              className="px-3 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40 transition-opacity"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
