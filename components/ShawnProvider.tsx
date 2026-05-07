'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { sendMessage } from '@/lib/shawn'

export interface Message {
  role: 'user' | 'shawn'
  text: string
}

interface ShawnContextValue {
  messages: Message[]
  loading: boolean
  send: (text: string) => Promise<void>
}

export const ShawnContext = createContext<ShawnContextValue>({
  messages: [],
  loading: false,
  send: async () => {},
})

export const useShawn = () => useContext(ShawnContext)

export function ShawnProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const lastBriefAt = useRef<number>(0)

  useEffect(() => {
    fireBrief()
  }, [])

  useEffect(() => {
    function onVisibility() {
      const now = Date.now()
      const hour = new Date().getHours()
      if (
        document.visibilityState === 'visible' &&
        now - lastBriefAt.current > 30 * 60 * 1000 &&
        hour < 18
      ) {
        fireBrief()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  async function fireBrief() {
    const hour = new Date().getHours()
    const tod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    lastBriefAt.current = Date.now()
    setLoading(true)
    const response = await sendMessage(
      `Good ${tod}. Brief me — what needs my attention today? Check my calendar, tasks, and goals. Keep it short.`
    )
    setMessages([{ role: 'shawn', text: response }])
    setLoading(false)
    fetch('/api/shawn/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response }),
    }).catch(() => {})
  }

  async function send(text: string) {
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    const response = await sendMessage(text)
    setMessages(prev => [...prev, { role: 'shawn', text: response }])
    setLoading(false)
  }

  return (
    <ShawnContext.Provider value={{ messages, loading, send }}>
      {children}
    </ShawnContext.Provider>
  )
}
