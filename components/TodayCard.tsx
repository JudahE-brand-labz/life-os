import type { HabitRow, TaskRow } from '@/lib/db'

const DOMAIN_LABELS: Record<string, string> = {
  fitness: 'Workout',
  writing: 'Write',
  hebrew: 'Hebrew',
}

const DOMAIN_ORDER = ['fitness', 'writing', 'hebrew']

interface Props {
  habits: HabitRow[]
  tasks: TaskRow[]
}

export default function TodayCard({ habits, tasks }: Props) {
  const habitMap = Object.fromEntries(habits.map(h => [h.domain, h.done]))

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Today</p>

      <div className="flex flex-col gap-2">
        {DOMAIN_ORDER.map(domain => {
          const done = habitMap[domain] ?? false
          return (
            <div key={domain} className="flex items-center gap-2">
              <span
                className="text-base leading-none"
                style={{ color: done ? '#CC785C' : undefined }}
              >
                {done ? '✓' : '○'}
              </span>
              <span
                className="text-sm"
                style={{ color: done ? '#CC785C' : '#71717a' }}
              >
                {DOMAIN_LABELS[domain] ?? domain}
              </span>
            </div>
          )
        })}
      </div>

      {tasks.length > 0 && (
        <>
          <div className="mt-4 mb-2 border-t border-zinc-800" />
          <div className="flex flex-col gap-1.5">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center gap-2">
                <span
                  className="text-base leading-none"
                  style={{ color: task.done ? '#CC785C' : undefined }}
                >
                  {task.done ? '✓' : '○'}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: task.done ? '#CC785C' : '#71717a' }}
                >
                  {task.content}
                </span>
              </div>
            ))}
            {tasks.length > 3 && (
              <p className="text-xs text-zinc-600 mt-0.5">+{tasks.length - 3} more</p>
            )}
          </div>
        </>
      )}

    </div>
  )
}
