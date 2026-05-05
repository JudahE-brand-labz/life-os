import Greeting from '@/components/Greeting'
import TodayCard from '@/components/TodayCard'
import StreaksCard from '@/components/StreaksCard'
import ThisWeekCard from '@/components/ThisWeekCard'
import ShawnGreeting from '@/components/ShawnGreeting'
import { getTodayHabits, getStreaks, getThisWeekProgress, getTodayTasks } from '@/lib/db'

export default async function HomePage() {
  const [habits, streaks, weekProgress, tasks] = await Promise.all([
    getTodayHabits(),
    getStreaks(),
    getThisWeekProgress(),
    getTodayTasks(),
  ])

  return (
    <div className="p-8 max-w-4xl">
      <Greeting />
      <div className="mt-8 grid grid-cols-3 gap-4">
        <TodayCard habits={habits} tasks={tasks} />
        <ThisWeekCard progress={weekProgress} />
        <StreaksCard streaks={streaks} />
      </div>
      <ShawnGreeting />
    </div>
  )
}
