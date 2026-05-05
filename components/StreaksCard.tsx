import type { StreakRow } from '@/lib/db'

const DOMAIN_META: Record<string, { label: string; emoji: string }> = {
  fitness:  { label: 'Fitness',  emoji: '💪' },
  writing:  { label: 'Writing',  emoji: '✍️' },
  hebrew:   { label: 'Hebrew',   emoji: '📖' },
  reading:  { label: 'Reading',  emoji: '📚' },
  tasks:    { label: 'Tasks',    emoji: '✅' },
}

const DOMAIN_ORDER = ['fitness', 'writing', 'hebrew']

interface Props {
  streaks: StreakRow[]
}

export default function StreaksCard({ streaks }: Props) {
  const streakMap = Object.fromEntries(streaks.map(s => [s.domain, s]))

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Streaks</p>

      <div className="flex flex-col gap-3">
        {DOMAIN_ORDER.map(domain => {
          const s = streakMap[domain]
          const current = s?.current_streak ?? 0
          const meta = DOMAIN_META[domain] ?? { label: domain, emoji: '•' }

          return (
            <div key={domain} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{meta.emoji}</span>
                <span className="text-sm text-zinc-400">{meta.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: current > 0 ? '#CC785C' : '#52525b' }}
                >
                  {current}
                </span>
                <span className="text-xs text-zinc-600">
                  {current === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {streaks.length === 0 && (
        <p className="text-zinc-600 text-xs mt-2">No streaks yet — tell Shawn what you did</p>
      )}
    </div>
  )
}
