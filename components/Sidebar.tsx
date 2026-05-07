'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'Home',    href: '/' },
  { label: 'Habits',  href: '/habits' },
  { label: 'Agents',  href: '/agents' },
  { label: 'Fitness', href: '/fitness' },
  { label: 'Hebrew',  href: '/hebrew' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{ width: '180px' }}
      className="flex-shrink-0 h-screen flex flex-col pt-8 px-4 bg-sidebar border-r border-border"
    >
      <div className="mb-10 px-2">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Life OS
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ label, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={active ? { color: '#CC785C' } : {}}
              className={`px-2 py-2 rounded text-sm font-medium transition-colors ${
                active ? '' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
