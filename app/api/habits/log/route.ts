import { logHabit } from '@/lib/db'

const VALID_DOMAINS = ['fitness', 'hebrew', 'writing']

export async function POST(req: Request) {
  const { domain, date } = await req.json()

  if (!VALID_DOMAINS.includes(domain)) {
    return Response.json({ error: `Unknown domain: ${domain}` }, { status: 400 })
  }

  try {
    const result = await logHabit(domain, date)
    return Response.json({ ok: true, current_streak: result.current_streak })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
