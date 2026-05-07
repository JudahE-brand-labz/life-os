'use client'

import { useState } from 'react'
import type { TaskRow } from '@/lib/db'

interface Props {
  initialTasks: TaskRow[]
}

export default function TasksCard({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [sortPending, setSortPending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length

  async function handleToggle(id: string, current: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !current } : t))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !current }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: current } : t))
    }
  }

  async function handleAdd() {
    const content = input.trim()
    if (!content || adding) return
    const tempId = crypto.randomUUID()
    const today = new Date().toISOString().split('T')[0]
    const temp: TaskRow = { id: tempId, content, done: false, task_date: today }
    setTasks(prev => [...prev, temp])
    setInput('')
    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const real: TaskRow = await res.json()
      setTasks(prev => prev.map(t => t.id === tempId ? real : t))
    } catch {
      setTasks(prev => prev.filter(t => t.id !== tempId))
    } finally {
      setAdding(false)
    }
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= tasks.length) return
    setSortPending(true)
    const next = [...tasks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setTasks(next)
    try {
      await Promise.all([
        fetch(`/api/tasks/${next[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: index }),
        }),
        fetch(`/api/tasks/${next[target].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: target }),
        }),
      ])
    } catch {
      setTasks(tasks)
    } finally {
      setSortPending(false)
    }
  }

  function startEdit(task: TaskRow) {
    setEditingId(task.id)
    setEditValue(task.content)
  }

  async function commitEdit(id: string) {
    const content = editValue.trim()
    setEditingId(null)
    if (!content) return
    const prev = tasks.find(t => t.id === id)?.content ?? ''
    if (content === prev) return
    setTasks(t => t.map(x => x.id === id ? { ...x, content } : x))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setTasks(t => t.map(x => x.id === id ? { ...x, content: prev } : x))
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Tasks</p>
        <span className="text-xs text-muted-foreground tabular-nums">{done} / {total}</span>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-1.5">
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground/60 mb-1">No tasks yet</p>
        )}
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-center gap-2 group">
            {/* Toggle */}
            <button
              onClick={() => handleToggle(task.id, task.done)}
              className="flex-shrink-0 text-base leading-none transition-colors"
              style={task.done ? { color: '#CC785C' } : {}}
              aria-label={task.done ? 'Mark undone' : 'Mark done'}
            >
              <span className={task.done ? '' : 'text-muted-foreground'}>
                {task.done ? '✓' : '○'}
              </span>
            </button>

            {/* Content — inline edit on click */}
            {editingId === task.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => commitEdit(task.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit(task.id) }
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 bg-muted border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-border"
              />
            ) : (
              <span
                onClick={() => startEdit(task)}
                className={`flex-1 text-sm cursor-text transition-colors ${
                  task.done
                    ? 'line-through'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
                style={task.done ? { color: '#CC785C' } : {}}
              >
                {task.content}
              </span>
            )}

            {/* Reorder buttons */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => handleMove(i, -1)}
                disabled={sortPending || i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs px-1 leading-none transition-colors"
                aria-label="Move up"
              >↑</button>
              <button
                onClick={() => handleMove(i, 1)}
                disabled={sortPending || i === tasks.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs px-1 leading-none transition-colors"
                aria-label="Move down"
              >↓</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="Add a task..."
          className="flex-1 bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-border"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || adding}
          style={{ backgroundColor: '#CC785C' }}
          className="px-2.5 py-1.5 rounded-md text-xs text-white font-medium disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  )
}
