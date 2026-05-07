import { getHabitConfig, getHabitHistory, getTodayHabits, getStreaks } from '@/lib/db'

function frequencyToTarget(frequency: string): number {
  if (frequency === 'daily') return 7
  const match = frequency.match(/^(\d+)x_week$/)
  return match ? parseInt(match[1]) : 7
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default async function HabitsPage() {
  const [config, history, todayHabits, streaks] = await Promise.all([
    getHabitConfig(),
    getHabitHistory(7),
    getTodayHabits(),
    getStreaks(),
  ])

  const todayMap  = Object.fromEntries(todayHabits.map(h => [h.domain, h.done]))
  const streakMap = Object.fromEntries(streaks.map(s => [s.domain, s.current_streak]))
  const last7     = getLast7Days()
  const today     = last7[last7.length - 1]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-foreground mb-1">Habits</h1>
        <p className="text-xs text-muted-foreground">
          Your habits are managed by Shawn. Tell him to change them.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {config.map(({ domain, label, frequency }) => {
          const doneSet   = new Set(history[domain] ?? [])
          const streak    = streakMap[domain] ?? 0
          const todayDone = todayMap[domain] ?? false
          const target    = frequencyToTarget(frequency)
          const weekDone  = last7.filter(d => doneSet.has(d)).length

          return (
            <div key={domain} className="rounded-lg border border-border bg-card p-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-base leading-none"
                    style={todayDone ? { color: '#CC785C' } : {}}
                  >
                    <span className={todayDone ? '' : 'text-muted-foreground'}>
                      {todayDone ? '✓' : '○'}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">{weekDone}/{target} this week</span>
                  {streak > 0 && (
                    <span className="tabular-nums">🔥 {streak}d</span>
                  )}
                </div>
              </div>

              {/* 7-day dot grid */}
              <div className="flex gap-2">
                {last7.map((date, i) => {
                  const done    = doneSet.has(date)
                  const isToday = date === today
                  return (
                    <div key={date} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`w-full aspect-square rounded-sm max-w-[28px] ${done ? '' : 'bg-muted'}`}
                        style={done ? { backgroundColor: '#CC785C' } : undefined}
                      />
                      <span
                        className={`text-xs tabular-nums ${isToday ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}
                      >
                        {DAY_LABELS[i]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {config.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No habits configured yet. Tell Shawn to add some.
          </p>
        )}
      </div>
    </div>
  )
}
