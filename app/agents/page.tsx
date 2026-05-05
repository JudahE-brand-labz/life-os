import AgentCard from '@/components/AgentCard'
import { getStatus } from '@/lib/shawn'

export default async function AgentsPage() {
  const status = await getStatus()
  const online = status !== null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Agents</h1>
      <div className="grid grid-cols-1 gap-4 max-w-sm">
        <AgentCard
          name="Shawn"
          status={online ? 'online' : 'offline'}
          lastActive={status?.lastSession ?? '—'}
          tokensToday={status?.tokensToday ?? 0}
          lastAction="Ready"
        />
      </div>
      <p className="mt-8 text-zinc-600 text-sm">More agents coming soon</p>
    </div>
  )
}
