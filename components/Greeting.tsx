'use client'

import { useEffect, useState } from 'react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function Greeting() {
  const [greeting, setGreeting] = useState(getGreeting())
  const [date, setDate] = useState(getFormattedDate())

  useEffect(() => {
    const id = setInterval(() => {
      setGreeting(getGreeting())
      setDate(getFormattedDate())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-semibold text-foreground">
        {greeting},{' '}
        <span style={{ color: '#CC785C' }}>Judah</span>
      </h1>
      <p className="mt-1 text-muted-foreground text-base">{date}</p>
    </div>
  )
}
