import Greeting from '@/components/Greeting'
import ShawnStrip from '@/components/ShawnStrip'
import TasksCard from '@/components/TasksCard'
import RightColumnWidget from '@/components/RightColumnWidget'
import { getTodayTasks, getTodayHabits, getStreaks, getThisWeekProgress, getTodayNote, getHabitConfig } from '@/lib/db'
import { deriveCharacterState } from '@/lib/character'

export default async function HomePage() {
  const [tasks, habits, streaks, weekProgress, todayNote, habitConfig] = await Promise.all([
    getTodayTasks(),
    getTodayHabits(),
    getStreaks(),
    getThisWeekProgress(),
    getTodayNote(),
    getHabitConfig(),
  ])

  const habitsDone  = habits.filter(h => h.done).length
  const habitsTotal = habits.length
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const streakAtRisk = streaks.some(s => {
    if (!s.last_completed) return false
    return s.last_completed < yStr
  })
  const hour           = today.getHours()
  const characterState = deriveCharacterState(habitsDone, habitsTotal, streakAtRisk, hour)

  return (
    <div className="p-8 max-w-4xl">
      <Greeting />
      <div className="mt-6">
        <ShawnStrip />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <TasksCard initialTasks={tasks} />
        <RightColumnWidget
          streaks={streaks}
          weekProgress={weekProgress}
          characterState={characterState}
          todayNote={todayNote}
          habitConfig={habitConfig}
        />
      </div>
    </div>
  )
}
