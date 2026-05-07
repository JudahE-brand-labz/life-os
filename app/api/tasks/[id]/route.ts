import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('done' in body)       updates.done = body.done
  if ('content' in body)    updates.content = body.content
  if ('sort_order' in body) updates.sort_order = body.sort_order
  if ('task_date' in body)  updates.task_date = body.task_date

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'no fields to update' }, { status: 400 })
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
