'use client'

import { useRef, useState } from 'react'
import { useShawn } from '@/components/ShawnProvider'

export default function ShawnStrip() {
  const { messages, loading, send } = useShawn()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const lastMsg = messages[messages.length - 1]

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    await send(text)
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div
      className="w-full rounded-lg border border-border bg-card overflow-hidden transition-all duration-300"
      style={{ maxHeight: open ? '320px' : '48px' }}
    >
      {/* Collapsed strip — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full h-12 flex items-center gap-3 px-4 text-left hover:bg-muted/40 transition-colors"
        aria-label={open ? 'Collapse Shawn' : 'Expand Shawn'}
      >
        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: loading ? '#FCD34D' : '#CC785C' }}
        />
        <span className="text-sm text-muted-foreground flex-1 truncate">
          {loading
            ? 'Shawn is thinking...'
            : lastMsg
              ? lastMsg.text.slice(0, 100)
              : 'Shawn'}
        </span>
        <span className="text-xs text-muted-foreground/50 flex-shrink-0">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded — messages + input */}
      <div className="flex flex-col" style={{ height: '272px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">
          {messages.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground/60 text-center mt-4">
              Say something to Shawn...
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[90%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'self-end bg-muted text-foreground ml-auto'
                  : 'self-start bg-transparent border border-border text-foreground'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {(loading || sending) && (
            <div className="self-start px-3 py-2 rounded-lg text-sm text-muted-foreground border border-border">
              thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Message Shawn..."
            className="flex-1 bg-muted border border-border text-foreground text-sm rounded-lg px-3 py-1.5 outline-none placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{ backgroundColor: '#CC785C' }}
            className="px-3 py-1.5 rounded-lg text-sm text-white font-medium disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
