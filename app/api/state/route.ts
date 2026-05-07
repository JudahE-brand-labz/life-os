import { getTodayTasks, getTodayHabits, getStreaks, getThisWeekProgress, getTodayNote } from '@/lib/db'

export async function GET() {
  const [tasks, habits, streaks, weekProgress, todayNote] = await Promise.all([
    getTodayTasks(),
    getTodayHabits(),
    getStreaks(),
    getThisWeekProgress(),
    getTodayNote(),
  ])
  return Response.json({ tasks, habits, streaks, weekProgress, todayNote })
}
