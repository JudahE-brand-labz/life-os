interface AgentCardProps {
  name: string
  status: 'online' | 'offline' | 'idle'
  lastActive: string
  tokensToday: number
  lastAction: string
  onClick?: () => void
}

const statusDot: Record<AgentCardProps['status'], string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-400',
  offline: 'bg-zinc-500',
}

export default function AgentCard({
  name,
  status,
  lastActive,
  tokensToday,
  lastAction,
  onClick,
}: AgentCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
        <span className="text-zinc-100 font-medium">{name}</span>
        <span className="ml-auto text-xs text-zinc-500 capitalize">{status}</span>
      </div>
      <div className="flex gap-6 mb-3">
        <div>
          <p className="text-xs text-zinc-500">Last active</p>
          <p className="text-sm text-zinc-300">{lastActive}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Tokens today</p>
          <p className="text-sm text-zinc-300">{tokensToday.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-600 truncate">{lastAction}</p>
    </div>
  )
}
