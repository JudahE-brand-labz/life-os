'use client'

import { useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useShawn } from '@/components/ShawnProvider'
import ShawnCharacter from '@/components/ShawnCharacter'

export default function ShawnChat() {
  const pathname = usePathname()
  const { messages, loading, send } = useShawn()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ShawnStrip handles home — float button only on other pages
  if (pathname === '/') return null

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    await send(text)
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const characterState = loading ? 'working' : 'idle'

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-6 flex flex-col rounded-xl border border-border bg-card shadow-2xl"
          style={{ width: '400px', height: '500px', zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-foreground font-medium">Shawn</span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.length === 0 && !loading && (
              <p className="text-muted-foreground text-sm text-center mt-4">
                Say something to Shawn...
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'self-end text-foreground bg-muted ml-auto'
                    : 'self-start text-foreground bg-card border border-border'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {(loading || sending) && (
              <div className="self-start px-3 py-2 rounded-lg text-sm text-muted-foreground bg-card border border-border">
                thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message Shawn..."
              className="flex-1 bg-muted border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none placeholder:text-muted-foreground/50"
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
        </div>
      )}

      {/* Pixel art character button */}
      <div
        className="fixed bottom-6 right-6"
        style={{ zIndex: 50 }}
      >
        <ShawnCharacter
          state={characterState}
          size="md"
          onClick={() => setOpen(o => !o)}
        />
      </div>
    </>
  )
}
