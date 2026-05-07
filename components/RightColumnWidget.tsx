'use client'

import { useEffect, useState } from 'react'
import ShawnCharacter, { type CharacterState } from '@/components/ShawnCharacter'
import DomainsCard from '@/components/DomainsCard'
import type { HabitConfigRow, StreakRow, WeekProgress } from '@/lib/db'

interface Props {
  streaks: StreakRow[]
  weekProgress: WeekProgress[]
  characterState: CharacterState
  todayNote: string | null
  habitConfig?: HabitConfigRow[]
}

const STORAGE_KEY = 'rightColumnView'

export default function RightColumnWidget({ streaks, weekProgress, characterState, todayNote, habitConfig }: Props) {
  const [view, setView] = useState(0)

  // Read from localStorage after mount only — avoids SSR hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '1') setView(1)
  }, [])

  function cycle(dir: -1 | 1) {
    const next = (view + dir + 2) % 2
    setView(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  return (
    <div
      className="rounded-lg border border-border bg-card p-5 flex flex-col"
      style={{ minHeight: '280px' }}
    >
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {view === 0 ? 'Daily Read' : 'Domains'}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => cycle(-1)}
            className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-0.5 rounded transition-colors"
            aria-label="Previous view"
          >◀</button>
          <button
            onClick={() => cycle(1)}
            className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-0.5 rounded transition-colors"
            aria-label="Next view"
          >▶</button>
        </div>
      </div>

      {/* View 1 — Daily Read */}
      {view === 0 && (
        <div className="flex flex-col items-center gap-4 flex-1">
          <ShawnCharacter state={characterState} size="md" />
          {todayNote ? (
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              {todayNote}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 text-center">
              No morning note yet
            </p>
          )}
        </div>
      )}

      {/* View 2 — Domains */}
      {view === 1 && (
        <div className="flex-1">
          <DomainsCard streaks={streaks} weekProgress={weekProgress} config={habitConfig} />
        </div>
      )}
    </div>
  )
}
