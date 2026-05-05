import { supabase } from './supabase'

export type HabitRow = { domain: string; done: boolean }
export type StreakRow = {
  domain: string
  current_streak: number
  longest_streak: number
  last_completed: string | null
}
export type WeekProgress = { domain: string; completed: number; target: number }
export type TaskRow = { id: string; content: string; done: boolean; task_date: string }

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
  const { data, error } = await supabase
    .from('tasks')
    .select('id, content, done, task_date')
    .eq('task_date', today)
    .order('created_at')
  if (error) console.error('[db] getTodayTasks:', error.message)
  return data ?? []
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
