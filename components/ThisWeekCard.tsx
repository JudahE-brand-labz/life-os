import type { WeekProgress } from '@/lib/db'

const DOMAIN_LABELS: Record<string, string> = {
  fitness: 'Workouts',
  writing: 'Writing',
  hebrew:  'Hebrew',
  reading: 'Reading',
  tasks:   'Tasks',
}

const DOMAIN_ORDER = ['fitness', 'writing', 'hebrew']

interface Props {
  progress: WeekProgress[]
}

export default function ThisWeekCard({ progress }: Props) {
  const progressMap = Object.fromEntries(progress.map(p => [p.domain, p]))

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">This Week</p>

      <div className="flex flex-col gap-3">
        {DOMAIN_ORDER.map(domain => {
          const p = progressMap[domain]
          const completed = p?.completed ?? 0
          const target = p?.target ?? 1
          const pct = Math.min(100, Math.round((completed / target) * 100))
          const done = completed >= target
          const label = DOMAIN_LABELS[domain] ?? domain

          return (
            <div key={domain}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-zinc-400">{label}</span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: done ? '#CC785C' : '#71717a' }}
                >
                  {completed}/{target}
                </span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: done ? '#CC785C' : '#3f3f46',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {progress.length === 0 && (
        <p className="text-zinc-600 text-xs mt-2">No data yet this week</p>
      )}
    </div>
  )
}
