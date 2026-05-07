import { addTask } from '@/lib/db'

export async function POST(req: Request) {
  const { content } = await req.json()
  if (!content?.trim()) {
    return Response.json({ error: 'content required' }, { status: 400 })
  }
  const task = await addTask(content.trim())
  return Response.json(task)
}
