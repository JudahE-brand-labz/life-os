import { supabase } from './supabase'

export type HabitRow = { domain: string; done: boolean }
export type HabitConfigRow = { id: string; domain: string; label: string; frequency: string; active: boolean }
export type StreakRow = {
  domain: string
  current_streak: number
  longest_streak: number
  last_completed: string | null
}
export type WeekProgress = { domain: string; completed: number; target: number }
export type TaskRow = { id: string; content: string; done: boolean; task_date: string; sort_order?: number | null }

export async function getTodayHabits(): Promise<HabitRow[]> {
  const today = getToday()
  const { data, error } = await supabase
    .from('habits')
    .select('domain, done')
    .eq('completed_at', today)
  if (error) console.error('[db] getTodayHabits:', error.message)
  return data ?? []
}

export async function getStreaks(): Promise<StreakRow[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('domain, current_streak, longest_streak, last_completed')
  if (error) console.error('[db] getStreaks:', error.message)
  return data ?? []
}

export async function getThisWeekProgress(): Promise<WeekProgress[]> {
  const monday = getMonday()
  const [habitsResult, goalsResult] = await Promise.all([
    supabase.from('habits').select('domain').gte('completed_at', monday).eq('done', true),
    supabase.from('weekly_goals').select('domain, target_per_week'),
  ])

  if (habitsResult.error) console.error('[db] getThisWeekProgress habits:', habitsResult.error.message)
  if (goalsResult.error) console.error('[db] getThisWeekProgress goals:', goalsResult.error.message)

  const counts: Record<string, number> = {}
  for (const h of habitsResult.data ?? []) {
    counts[h.domain] = (counts[h.domain] ?? 0) + 1
  }

  return (goalsResult.data ?? []).map(g => ({
    domain: g.domain,
    completed: counts[g.domain] ?? 0,
    target: g.target_per_week,
  }))
}

export async function getTodayTasks(): Promise<TaskRow[]> {
  const today = getToday()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { data: any; error: any } = await supabase
    .from('tasks')
    .select('id, content, done, task_date, sort_order')
    .eq('task_date', today)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at')
  if (res.error?.message?.includes('sort_order')) {
    // sort_order column not yet migrated — fall back to created_at only
    res = await supabase
      .from('tasks')
      .select('id, content, done, task_date')
      .eq('task_date', today)
      .order('created_at')
  }
  if (res.error) console.error('[db] getTodayTasks:', res.error.message)
  return (res.data ?? []) as TaskRow[]
}

export async function addTask(content: string): Promise<TaskRow> {
  const today = getToday()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ content, done: false, task_date: today })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateTaskContent(id: string, content: string): Promise<void> {
  const { error } = await supabase.from('tasks').update({ content }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderTask(id: string, sort_order: number): Promise<void> {
  const { error } = await supabase.from('tasks').update({ sort_order }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function logHabit(domain: string, date?: string): Promise<{ current_streak: number }> {
  const today = date ?? getToday()

  const { error: habitError } = await supabase
    .from('habits')
    .upsert({ domain, completed_at: today, done: true }, { onConflict: 'domain,completed_at' })
  if (habitError) throw new Error(habitError.message)

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('domain', domain)
    .maybeSingle()

  const yesterday = new Date(today + 'T12:00:00Z')
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const lastCompleted = streak?.last_completed
    ? new Date(streak.last_completed + 'T12:00:00Z').toISOString().split('T')[0]
    : null
  const current = lastCompleted === yStr ? (streak?.current_streak ?? 0) + 1 : 1
  const longest = Math.max(current, streak?.longest_streak ?? 0)

  const { error: streakError } = await supabase.from('streaks').upsert(
    { domain, current_streak: current, longest_streak: longest, last_completed: today, updated_at: new Date().toISOString() },
    { onConflict: 'domain' }
  )
  if (streakError) throw new Error(streakError.message)

  return { current_streak: current }
}

export async function getTodayNote(): Promise<string | null> {
  const today = getToday()
  const { data, error } = await supabase
    .from('memories')
    .select('content')
    .eq('type', 'daily_note')
    .eq('date', today)
    .maybeSingle()
  // Silently return null if date column doesn't exist yet (pre-migration)
  if (error && !error.message.includes('date')) console.error('[db] getTodayNote:', error.message)
  return data?.content ?? null
}

export async function saveTodayNote(content: string): Promise<void> {
  const today = getToday()
  const { error } = await supabase
    .from('memories')
    .upsert({ type: 'daily_note', content, date: today }, { onConflict: 'type,date' })
  if (error) throw new Error(error.message)
}

export async function getHabitConfig(): Promise<HabitConfigRow[]> {
  const { data, error } = await supabase
    .from('habit_config')
    .select('id, domain, label, frequency, active')
    .eq('active', true)
    .order('domain')
  // Silently return [] if table doesn't exist yet (pre-migration); DomainsCard uses hardcoded fallback
  if (error && !error.message.includes('habit_config')) console.error('[db] getHabitConfig:', error.message)
  return data ?? []
}

export async function getHabitHistory(days = 7): Promise<Record<string, string[]>> {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  const sinceStr = since.toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('habits')
    .select('domain, completed_at')
    .gte('completed_at', sinceStr)
    .eq('done', true)
  if (error) console.error('[db] getHabitHistory:', error.message)
  const result: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!result[row.domain]) result[row.domain] = []
    result[row.domain].push(row.completed_at)
  }
  return result
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
