import type { HabitConfigRow, StreakRow, WeekProgress } from '@/lib/db'

// Fallback used until habit_config table is populated
const FALLBACK_CONFIG: HabitConfigRow[] = [
  { id: 'fitness', domain: 'fitness', label: 'Fitness', frequency: '4x_week', active: true },
  { id: 'hebrew',  domain: 'hebrew',  label: 'Hebrew',  frequency: 'daily',   active: true },
  { id: 'writing', domain: 'writing', label: 'Writing', frequency: 'daily',   active: true },
]

function frequencyToTarget(frequency: string): number {
  if (frequency === 'daily') return 7
  const match = frequency.match(/^(\d+)x_week$/)
  return match ? parseInt(match[1]) : 7
}

interface Props {
  streaks: StreakRow[]
  weekProgress: WeekProgress[]
  config?: HabitConfigRow[]
}

export default function DomainsCard({ streaks, weekProgress, config }: Props) {
  const domains     = config?.length ? config : FALLBACK_CONFIG
  const streakMap   = Object.fromEntries(streaks.map(s => [s.domain, s.current_streak]))
  const progressMap = Object.fromEntries(weekProgress.map(w => [w.domain, { completed: w.completed, target: w.target }]))

  return (
    <div className="flex flex-col gap-4">
      {domains.map(({ domain, label, frequency }) => {
        const streak    = streakMap[domain] ?? 0
        const progress  = progressMap[domain]
        const completed = progress?.completed ?? 0
        const total     = progress?.target ?? frequencyToTarget(frequency)
        const filled    = total > 0 ? Math.round(Math.min(completed / total, 1) * 7) : 0

        return (
          <div key={domain} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {streak > 0 ? `🔥 ${streak}d` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${i < filled ? '' : 'bg-muted'}`}
                    style={i < filled ? { backgroundColor: '#CC785C' } : undefined}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                {completed}/{total}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
