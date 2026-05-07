import { saveTodayNote } from '@/lib/db'

export async function POST(req: Request) {
  const { content } = await req.json()
  if (!content?.trim()) {
    return Response.json({ error: 'content required' }, { status: 400 })
  }
  try {
    await saveTodayNote(content.trim())
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
