# Life OS Expansion Plan
_Written 2026-05-07. Updated 2026-05-07 with review findings. Execute this plan in a fresh session._

## Goal
Two things in priority order:
1. **Shawn becomes a real operator** — he can read Life OS data (tasks, habits, streaks) and write to it via API calls
2. **Home page redesign** — tasks dominate, Shawn has aesthetic presence, layout is cleaner

---

## How Shawn Connects to Claude

Shawn does NOT use the Anthropic SDK or direct HTTP API. It spawns `claude` (the Claude Code CLI) as a child process via `spawn()`, passes the message via `-p`, and reads JSON from stdout. The CLI handles tool use internally — Shawn sees tool results (including Bash/curl output) before returning his final text.

**Critical implication for writes:** The default mode is `'chat'`, which filters `--allowedTools` to only Gmail, Calendar, WebSearch, WebFetch — **no Bash**. Telling Shawn to call `curl` in the system context won't work in the default mode. The fix: use `[LOG:{...}]` markers for writes (same proven mechanism already in use) rather than curl commands.

---

## Review Findings & Fixes

Bugs caught by pre-execution review, addressed below in the plan:

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | `.single()` crashes if no streak row exists (first-time habit) | Critical | Use `.maybeSingle()` |
| 2 | Curl write approach fails — default mode is `'chat'`, Bash blocked | Critical | Use `[LOG:{...}]` markers for all writes |
| 3 | GET /api/state called on every relay — N+1 DB queries, no caching | High | 30s TTL module-level cache in server.ts |
| 4 | Step ordering: DB migration must run before any code using new columns | High | Make Step 0 explicit; 1f → 1d → 1g ordering enforced |
| 5 | Step 2 page.tsx derives character state manually; Step 3 creates `deriveCharacterState()` — never wired together | High | Build ShawnCharacter.tsx before Step 3 (new Step 2); home page redesign becomes Step 3 |
| 6 | Morning note persisted in Step 5, but morning brief runs from Step 1 — notes lost for days 1-4 | High | Pull `POST /api/shawn/note` and `todayNote` into Step 1 |
| 7 | No domain validation — Shawn can log to invented domain names | Medium | Whitelist `['fitness', 'hebrew', 'writing']` in `/api/habits/log` |
| 8 | Sort order: multiple in-flight ↑↓ mutations race each other | Medium | Disable ↑↓ buttons while any sort mutation is pending |
| 9 | `deriveCharacterState` computed server-side once; never updates when habits complete in UI | Low | Accept — page refresh updates it; document as known limitation |

---

## Build Order (Revised)

### Step 0 — DB Migration (run in Supabase SQL editor FIRST, before any code)

```sql
alter table tasks add column if not exists sort_order integer;
alter table tasks add column if not exists updated_at timestamptz default now();

create table if not exists habit_config (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  label text not null,
  frequency text not null default 'daily',
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

insert into habit_config (domain, label, frequency) values
  ('fitness', 'Fitness', '4x_week'),
  ('hebrew', 'Hebrew', 'daily'),
  ('writing', 'Writing', 'daily')
on conflict (domain) do nothing;
```

**Why first:** Code in Steps 1d, 1g uses `sort_order`. If the column doesn't exist when that code deploys, it silently breaks.

---

### Step 1 — Shawn ↔ Life OS Integration (highest priority)

#### 1a. Add `systemAppend` to relay.ts
File: `/Users/judahevans/Projects/shawn/src/relay.ts`

Add to `RelayOptions` interface:
```typescript
systemAppend?: string
```

`buildSystemPrompt` currently takes 4 params. Add a 5th:
```typescript
function buildSystemPrompt(
  mode: Mode, personality: Personality,
  memoryContext: string, modeContext: string,
  systemAppend?: string
): string {
  // ... existing logic ...
  if (systemAppend) parts.push(`# Life OS Context\n${systemAppend}`)
  return parts.join('\n\n')
}
```

Update the call site inside `relay()`:
```typescript
const systemPrompt = buildSystemPrompt(mode, personality, memoryContext, modeContext, opts.systemAppend)
```

#### 1b. Add GET /api/state to Life OS
File: `/Users/judahevans/Projects/life.os/app/api/state/route.ts` (NEW)

```typescript
import { getTodayTasks, getTodayHabits, getStreaks, getThisWeekProgress, getTodayNote } from '@/lib/db'
export async function GET() {
  const [tasks, habits, streaks, weekProgress, todayNote] = await Promise.all([
    getTodayTasks(), getTodayHabits(), getStreaks(), getThisWeekProgress(), getTodayNote()
  ])
  return Response.json({ tasks, habits, streaks, weekProgress, todayNote })
}
```

#### 1c. Add POST /api/habits/log to Life OS
File: `/Users/judahevans/Projects/life.os/app/api/habits/log/route.ts` (NEW)

**Bug fix applied: `.maybeSingle()` instead of `.single()`. Domain validation whitelist.**

```typescript
const VALID_DOMAINS = ['fitness', 'hebrew', 'writing']

export async function POST(req: Request) {
  const { domain, date } = await req.json()

  if (!VALID_DOMAINS.includes(domain)) {
    return Response.json({ error: `Unknown domain: ${domain}` }, { status: 400 })
  }

  const today = date ?? new Date().toISOString().split('T')[0]

  const { error: habitError } = await supabase
    .from('habits')
    .upsert({ domain, completed_at: today, done: true }, { onConflict: 'domain,completed_at' })
  if (habitError) return Response.json({ error: habitError.message }, { status: 500 })

  // Bug fix: use maybeSingle() — .single() throws if no streak row exists yet
  const { data: streak } = await supabase.from('streaks').select('*').eq('domain', domain).maybeSingle()
  const yesterday = new Date(today + 'T12:00:00Z')
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const lastCompleted = streak?.last_completed
    ? new Date(streak.last_completed + 'T12:00:00Z').toISOString().split('T')[0]
    : null
  const current = lastCompleted === yStr ? (streak?.current_streak ?? 0) + 1 : 1
  const longest = Math.max(current, streak?.longest_streak ?? 0)

  await supabase.from('streaks').upsert(
    { domain, current_streak: current, longest_streak: longest, last_completed: today, updated_at: new Date().toISOString() },
    { onConflict: 'domain' }
  )

  return Response.json({ ok: true, current_streak: current })
}
```

#### 1d. Expand PATCH /api/tasks/[id]
File: `/Users/judahevans/Projects/life.os/app/api/tasks/[id]/route.ts` (UPDATE)

Handle partial updates safely — only touch fields present in the body:

```typescript
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('done' in body)       updates.done = body.done
  if ('content' in body)    updates.content = body.content
  if ('sort_order' in body) updates.sort_order = body.sort_order
  if ('task_date' in body)  updates.task_date = body.task_date

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'no fields to update' }, { status: 400 })
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

#### 1e. Add POST /api/shawn/note to Life OS
File: `/Users/judahevans/Projects/life.os/app/api/shawn/note/route.ts` (NEW)

**Bug fix: pulled from Step 5 into Step 1 so morning notes persist from day one.**

```typescript
export async function POST(req: Request) {
  const { content } = await req.json()
  if (!content?.trim()) return Response.json({ error: 'content required' }, { status: 400 })
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('memories')
    .upsert({ type: 'daily_note', content: content.trim(), date: today }, { onConflict: 'type,date' })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

Note: `memories` table needs a `date` column if it doesn't have one. Check schema; add `alter table memories add column if not exists date date` if needed.

#### 1f. Update lib/db.ts
File: `/Users/judahevans/Projects/life.os/lib/db.ts` (UPDATE)

Add:
```typescript
export async function updateTaskContent(id: string, content: string): Promise<void>
export async function reorderTask(id: string, sort_order: number): Promise<void>
export async function logHabit(domain: string, date?: string): Promise<void>
export async function getTodayNote(): Promise<string | null>
// getTodayNote: query memories table where type='daily_note' and date=today, return content or null
```

Update `getTodayTasks()` to `order('sort_order', { ascending: true, nullsFirst: false })` then `.order('created_at')` as secondary.

#### 1g. Update server.ts — inject context + write via markers
File: `/Users/judahevans/Projects/shawn/src/server.ts` (UPDATE)

**Bug fix: 30s TTL cache so every message doesn't hammer the DB. Write via `[LOG:{...}]` markers instead of curl (curl fails in 'chat' mode — Bash is blocked).**

```typescript
// Module-level cache — avoids N+1 on rapid messages
let stateCache: { data: string; ts: number } | null = null
const STATE_TTL_MS = 30_000

app.post('/relay', async (req, res) => {
  const { message } = req.body

  let lifeOsContext = ''
  try {
    const now = Date.now()
    if (!stateCache || now - stateCache.ts > STATE_TTL_MS) {
      const stateRes = await fetch('http://localhost:3000/api/state')
      if (stateRes.ok) {
        const state = await stateRes.json()
        stateCache = { data: buildLifeOsContext(state), ts: now }
      }
    }
    if (stateCache) lifeOsContext = stateCache.data
  } catch { /* Life OS offline — continue without context */ }

  const result = await relay({
    message,
    mode: getPersistedMode(),
    personality: 'chill',
    silent: true,
    cwd: process.cwd(),
    systemAppend: lifeOsContext || undefined,
  })

  // Invalidate cache after a write (Shawn may have logged a habit or task)
  if (result.output.includes('[LOG:')) stateCache = null

  // ... rest of handler (extractLog, logFromMarker, res.json) unchanged
})
```

**Context string uses `[LOG:{...}]` markers for writes, not curl:**

```typescript
function buildLifeOsContext({ tasks, habits, streaks, weekProgress, todayNote }): string {
  const taskList = tasks
    .map(t => `  - [${t.id}] ${t.done ? '✓' : '○'} ${t.content.slice(0, 80)}`)
    .join('\n')
  const habitList = habits.map(h => `  - ${h.domain}: ${h.done ? 'done' : 'pending'}`).join('\n')
  const streakList = streaks.map(s => `  - ${s.domain}: ${s.current_streak} days`).join('\n')

  return `
You have full read/write access to Life OS. Current state:

TASKS (today):
${taskList || '  (none)'}

HABITS (today):
${habitList || '  (none)'}

STREAKS:
${streakList || '  (none)'}

WRITE FORMAT — append a [LOG:{...}] marker at the end of your response (server strips it):
  Mark habit done:   [LOG:{"type":"habit_done","domain":"fitness"}]
  Toggle task done:  [LOG:{"type":"task_toggle","id":"<task-id>","done":true}]
  Update task text:  [LOG:{"type":"task_update","id":"<task-id>","content":"new text"}]
  Add task:          [LOG:{"type":"tasks_add","tasks":["task text"]}]

Always confirm writes in your response text. If a write fails, say so.
`.trim()
}
```

**Extend logFromMarker in lifeos.ts (or server.ts) to handle new types:**

Add cases for `habit_done`, `task_toggle`, `task_update` that call the Life OS API:
```typescript
case 'habit_done':
  await fetch(`http://localhost:3000/api/habits/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: data.domain })
  })
  break
case 'task_toggle':
  await fetch(`http://localhost:3000/api/tasks/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: data.done })
  })
  break
case 'task_update':
  await fetch(`http://localhost:3000/api/tasks/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: data.content })
  })
  break
```

Also update ShawnProvider.tsx to call `POST /api/shawn/note` after the morning brief response comes back.

---

### Step 2 — Shawn Character (build BEFORE home page redesign)

**Bug fix: ShawnCharacter.tsx must exist before Step 3 can import `deriveCharacterState` from it.**

#### ShawnCharacter.tsx (NEW)
File: `/Users/judahevans/Projects/life.os/components/ShawnCharacter.tsx`

- Pixel art SVG character (~32×32 grid aesthetic)
- States: `idle` | `working` | `celebrating` | `concerned` | `sleeping`
- `'use client'` at top (animations run client-side)
- Export `deriveCharacterState` as a **named plain function** (no hooks, no client deps) so `page.tsx` server component can import it:

```typescript
export type CharacterState = 'idle' | 'working' | 'celebrating' | 'concerned' | 'sleeping'

export function deriveCharacterState(
  habitsDone: number, habitsTotal: number, streakAtRisk: boolean, hour: number
): CharacterState {
  if (hour >= 21) return 'sleeping'
  if (habitsDone === habitsTotal && habitsTotal > 0) return 'celebrating'
  if (streakAtRisk) return 'concerned'
  if (hour >= 9 && hour < 18) return 'working'
  return 'idle'
}
```

- Idle animation: `@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }`
- Build pixel art as SVG `<rect>` elements. Start idle state, add others incrementally.
- Props: `state: CharacterState`, `size: 'sm' | 'md'`

#### Known limitation (Bug 9 — accepted)
`characterState` is derived server-side at page render and passed as a prop. It won't update when the user completes habits in the UI without a page refresh. This is acceptable for a personal tool; document it as known behavior.

---

### Step 3 — Home Page Layout Redesign

**Now safe to import `deriveCharacterState` from ShawnCharacter.tsx (built in Step 2).**

#### New page.tsx layout
File: `/Users/judahevans/Projects/life.os/app/page.tsx`

```tsx
// page.tsx uses deriveCharacterState from ShawnCharacter — imported as a plain function, no 'use client'
import { deriveCharacterState } from '@/components/ShawnCharacter'

// Character state derivation (server-side)
const habitsDone = habits.filter(h => h.done).length
const habitsTotal = habits.length
const streakAtRisk = streaks.some(s => {
  if (!s.last_completed) return false
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  return new Date(s.last_completed) < yesterday
})
const hour = new Date().getHours()
const characterState = deriveCharacterState(habitsDone, habitsTotal, streakAtRisk, hour)
```

Layout:
```
<Greeting />
<ShawnStrip />                          ← NEW, replaces ShawnGreeting
<div className="grid grid-cols-3 gap-4">
  <TasksCard ... className="col-span-2" />   ← replaces TodayCard, wider
  <RightColumnWidget ... />             ← NEW, cycles between views
</div>
```

Remove: `<ThisWeekCard />`, `<StreaksCard />`, `<ShawnGreeting />`

#### TasksCard (refactor TodayCard.tsx → TasksCard.tsx)
File: `/Users/judahevans/Projects/life.os/components/TasksCard.tsx`

- Remove habits section entirely
- Add count: `3 / 7` in header
- Add inline edit: click task text → `<input>`, blur/Enter calls `PATCH /api/tasks/[id]` with `{ content }`
- Add reorder: `↑ ↓` buttons per task, calls `PATCH /api/tasks/[id]` with `{ sort_order }`
- **Bug fix:** disable both ↑ and ↓ buttons on ALL tasks while any sort mutation is pending (single `sortPending` boolean state). Prevents race conditions from multiple in-flight sort mutations.
- Completed tasks stay visible (crossed out), cleared on new day
- Keep optimistic updates + rollback on error
- Props: `initialTasks: TaskRow[]`

#### ShawnStrip (NEW, replaces ShawnGreeting)
File: `/Users/judahevans/Projects/life.os/components/ShawnStrip.tsx`

- Full-width, `h-12` when collapsed
- Shows: status dot + last Shawn message truncated to one line
- Click → CSS `max-height` transition to reveal full chat thread + input (`h-72`)
- Reads from `useShawn()` context (same thread as ShawnChat)
- `ShawnGreeting.tsx` gets deleted after this is working

ShawnChat on home page returns null:
```tsx
const pathname = usePathname()
if (pathname === '/') return null  // ShawnStrip handles home
```

#### RightColumnWidget (NEW)
File: `/Users/judahevans/Projects/life.os/components/RightColumnWidget.tsx`

- `'use client'` component
- Receives server-fetched data as props from `page.tsx`
- Cycles between 2 views via `◀ ▶` arrows
- **Fixed height** on both views to prevent layout shift on cycle (e.g. `min-h-[280px]`)
- Active view index persisted to `localStorage('rightColumnView')` — read in `useEffect` only (avoid SSR mismatch)

Props:
```typescript
interface Props {
  streaks: StreakRow[]
  weekProgress: WeekProgress[]
  characterState: CharacterState
  todayNote: string | null
}
```

Views:
- **View 1 — Daily Read**: `<ShawnCharacter state={characterState} size="md" />` + Shawn's morning note text
- **View 2 — Domains**: streak + weekly progress per domain

#### DomainsCard (NEW, lives inside RightColumnWidget view 2)
File: `/Users/judahevans/Projects/life.os/components/DomainsCard.tsx`

Per-domain row: `[icon] Name [████░░░] 3/4  🔥 12d`

**Hardcode the three domains** (Fitness, Writing, Hebrew) in Step 3. Step 4 adds `habit_config` table; at that point refactor to query `getHabitConfig()`. Don't abstract prematurely.

#### Update ShawnChat.tsx (floating button)
Replace the S button circle with:
```tsx
<ShawnCharacter state={characterState} size="sm" onClick={toggleOpen} />
```

ShawnChat needs `characterState` prop passed from layout — or derive it locally from ShawnContext data.

#### Files to DELETE after Step 3:
- `components/ShawnGreeting.tsx`
- `components/ThisWeekCard.tsx`
- `components/StreaksCard.tsx`
- `components/TodayCard.tsx`

---

### Step 4 — Habits Page

#### /habits page
File: `/Users/judahevans/Projects/life.os/app/habits/page.tsx` (UPDATE from stub)

- Server component, fetches today's habits + last 7 days via `getHabitHistory(7)`
- Shows: per-domain row with today's status + 7-day dot grid (Mon-Sun)
- User never manually edits — all changes go through Shawn
- Header note: "Your habits are managed by Shawn. Tell him to change them."

#### Add getHabitHistory + getHabitConfig to lib/db.ts
```typescript
export async function getHabitHistory(days = 7): Promise<Record<string, string[]>>
// Returns { fitness: ['2026-05-01', '2026-05-03', ...], ... }

export async function getHabitConfig(): Promise<HabitConfigRow[]>
```

Refactor `DomainsCard` to use `getHabitConfig()` instead of hardcoded domains.

---

## Key Gotchas for Execution

- **Shawn writes via `[LOG:{...}]`, not curl.** Default mode is `'chat'` which blocks Bash. The context string instructs Shawn to use markers, not curl commands.
- **30s TTL cache in server.ts** — after Shawn's response contains `[LOG:`, invalidate the cache so the next relay call reflects the write.
- **`maybeSingle()` not `single()`** in the streak query — `single()` throws on no row.
- **Domain whitelist** in `/api/habits/log` — reject unknown domains before they pollute the DB.
- **Sort mutations: one at a time** — `sortPending` boolean blocks ↑↓ until the active PATCH resolves.
- **Step 0 runs before everything** — no code should deploy against `sort_order` until the migration runs.
- **ShawnCharacter in Step 2, home page in Step 3** — reversed from original plan so `deriveCharacterState` exists before `page.tsx` imports it.
- **Morning note persisted in Step 1** — `POST /api/shawn/note` and `getTodayNote()` in `/api/state` are Step 1 work, not deferred to Step 5.
- `relay.ts` builds system prompt from brain files at module load. `systemAppend` must be injected at call time, not load time.
- Next.js 15/16: `params` in route handlers is a Promise — always `await params`.
- `next-themes` installed with `--legacy-peer-deps`. If adding new packages, use same flag.
- `ShawnCharacter` is a client component (animations). `deriveCharacterState` is exported as a plain function — no hooks, no client deps — so server components can import it safely.
- `RightColumnWidget` reads `localStorage` only in a `useEffect` (after mount) to avoid SSR hydration mismatch.
- `PATCH /api/tasks/[id]` uses field-presence check (`'done' in body`) — never overwrites fields not in the request body.
- **System prompt length:** keep context block under ~2000 characters. Task content truncated at 80 chars.
- `DomainsCard` hardcodes three domains in Step 3. Step 4 refactors it to use `habit_config` table.

---

## Files Touched (Full List)

### Life OS (`/Users/judahevans/Projects/life.os`)
| File | Action |
|---|---|
| `app/page.tsx` | Update layout + import `deriveCharacterState` |
| `app/api/state/route.ts` | NEW (includes `todayNote`) |
| `app/api/habits/log/route.ts` | NEW (domain whitelist + `.maybeSingle()`) |
| `app/api/tasks/[id]/route.ts` | Expand PATCH (partial update safe) |
| `app/api/shawn/note/route.ts` | NEW (pulled from Step 5 → Step 1) |
| `app/habits/page.tsx` | Build out from stub |
| `components/ShawnCharacter.tsx` | NEW (Step 2, before home page) |
| `components/TasksCard.tsx` | NEW (replaces TodayCard, sortPending guard) |
| `components/ShawnStrip.tsx` | NEW (replaces ShawnGreeting) |
| `components/RightColumnWidget.tsx` | NEW (fixed height, localStorage in useEffect) |
| `components/DomainsCard.tsx` | NEW (hardcoded domains Step 3, dynamic Step 4) |
| `components/ShawnChat.tsx` | Update floating button + pathname guard |
| `components/Sidebar.tsx` | Add Habits link |
| `components/TodayCard.tsx` | DELETE |
| `components/ShawnGreeting.tsx` | DELETE |
| `components/ThisWeekCard.tsx` | DELETE |
| `components/StreaksCard.tsx` | DELETE |
| `lib/db.ts` | Add new query functions + update getTodayTasks ordering |

### Shawn (`/Users/judahevans/Projects/shawn`)
| File | Action |
|---|---|
| `src/relay.ts` | Add `systemAppend` to RelayOptions + buildSystemPrompt |
| `src/server.ts` | Fetch Life OS state (30s TTL cache) + inject context (marker format) |
| `src/lifeos.ts` | Add `habit_done`, `task_toggle`, `task_update` marker cases |

---

## Verification Checklist
1. `cd ~/Projects/shawn && npm run serve` — Shawn server starts on :4242
2. `cd ~/Projects/life.os && npm run dev` — Life OS starts on :3000
3. Open http://localhost:3000 — new layout: ShawnStrip at top, Tasks (wide), RightColumnWidget (right)
4. Send a message via ShawnStrip → response appears, thread persists
5. Say "I did Hebrew today" → Shawn responds with `[LOG:{"type":"habit_done","domain":"hebrew"}]` stripped, streak updates in Supabase, DomainsCard reflects it on next refresh
6. Add a task → appears, reorder with ↑↓ → order persists on refresh; clicking both buttons disabled while mutation is pending
7. Click a task's text → inline edit, save → content updates
8. Open /habits → today's habits visible with 7-day history
9. Bottom-right: pixel art character instead of S button → click → chat opens
10. RightColumnWidget: arrows cycle between Daily Read and Domains views without layout shift
11. Morning brief: Shawn's response references real data (actual tasks/streaks, not generic greeting)
12. Shawn's morning note visible in Daily Read view after page refresh (persisted in Step 1)
13. Log a habit for a brand new domain → returns 400 (domain whitelist working)
14. First-time habit log for existing domain (no streak row yet) → streak row created, no crash
