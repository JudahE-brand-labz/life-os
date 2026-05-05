const SHAWN_API = process.env.NEXT_PUBLIC_SHAWN_API ?? 'http://localhost:4242'

export async function sendMessage(message: string): Promise<string> {
  try {
    const res = await fetch(`${SHAWN_API}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    return data.text ?? data.response ?? JSON.stringify(data)
  } catch {
    return 'Shawn is offline — run shawn serve to connect.'
  }
}

export interface ShawnStatus {
  lastSession: string
  turns: number
  tokensToday: number
}

export async function getStatus(): Promise<ShawnStatus | null> {
  try {
    const res = await fetch(`${SHAWN_API}/status`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
