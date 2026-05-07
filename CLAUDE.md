@AGENTS.md

# Life OS

A personal operating system — a Next.js dashboard that orchestrates Judah's daily habits, goals, and progress across 5 life domains. Shawn (the AI agent, at `/Users/judahevans/Projects/shawn`) is the kernel. This is a deeply personal tool built to last, not a generic productivity app.

Full design blueprint is in the Obsidian vault:
`/Users/judahevans/Documents/Judah Idea Network/Life OS Blueprint.md`

---

## To start the app

```bash
# Terminal 1 — Shawn server
cd ~/Projects/shawn && npm run serve

# Terminal 2 — Life OS
cd ~/Projects/life.os && npm run dev
```
Open http://localhost:3000

---

## Current State (as of 2026-05-07)

### What's built and working

**Backend (Shawn server)**
- Express server on `:4242` (`/Users/judahevans/Projects/shawn/src/server.ts`)
- `POST /relay` → fetches Life OS state (30s TTL cache), injects tasks/habits/streaks into Shawn's context via `systemAppend`, processes message, strips `[LOG:{...}]` markers, routes writes to Life OS API or direct Supabase, returns clean text
- `GET /status` → returns session info
- Cache invalidated after any write (when response contains `[LOG:`)

**Shawn ↔ Life OS write protocol**
Shawn writes via `[LOG:{...}]` markers (NOT curl — Bash is blocked in 'chat' mode):
- `[LOG:{"type":"habit_done","domain":"fitness"}]` → calls `POST /api/habits/log`
- `[LOG:{"type":"task_toggle","id":"<id>","done":true}]` → calls `PATCH /api/tasks/<id>`
- `[LOG:{"type":"task_update","id":"<id>","content":"new text"}]` → calls `PATCH /api/tasks/<id>`
- `[LOG:{"type":"tasks_add","tasks":["text"]}]` → direct Supabase insert
- Legacy: `fitness_session`, `writing_log`, `hebrew_session` → direct Supabase + streak update

**Supabase** (project `adsyromvklfqlbmfcgdg`)
Tables: `habits`, `streaks`, `fitness_sessions`, `writing_logs`, `hebrew_sessions`, `reading_log`, `tasks`, `weekly_goals`, `memories`, `habit_config`

**Pending migration (Step 0 — must run in Supabase SQL editor if not done):**
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
alter table memories add column if not exists date date;
create unique index if not exists memories_type_date_idx on memories(type, date) where date is not null;
```
Code gracefully degrades until migration runs (tasks show without sort_order, morning note returns null, habit_config falls back to hardcoded domains).

**Data layer** (`lib/db.ts`)
- `getTodayHabits()` — habit completion per domain for today
- `getStreaks()` — current + longest streak per domain
- `getThisWeekProgress()` — completed vs target per domain since Monday
- `getTodayTasks()` — tasks ordered by sort_order then created_at; gracefully falls back to created_at-only if sort_order column not yet migrated
- `addTask(content)` — inserts task for today
- `toggleTask(id, done)` — updates done status
- `updateTaskContent(id, content)` — updates task text
- `reorderTask(id, sort_order)` — updates sort order
- `logHabit(domain, date?)` — upserts habit + updates streak (uses `.maybeSingle()` — safe for first-time logs)
- `getTodayNote()` — reads daily_note from memories table for today
- `saveTodayNote(content)` — upserts daily_note to memories
- `getHabitConfig()` — reads active habits from habit_config table
- `getHabitHistory(days)` — returns per-domain completed dates for last N days

**API routes**
- `GET /api/state` — aggregates tasks/habits/streaks/weekProgress/todayNote for Shawn
- `POST /api/tasks` — add a task
- `PATCH /api/tasks/[id]` — partial update (done, content, sort_order, task_date); field-presence safe
- `POST /api/habits/log` — log a habit done (domain whitelist: fitness/hebrew/writing)
- `POST /api/shawn/note` — save morning brief as daily note

**Home page** (`app/page.tsx`) — server component:
- `Greeting` — time-aware greeting, updates every minute
- `ShawnStrip` — full-width collapsible strip at top; shows last Shawn message; click expands to full chat thread + input; returns null on non-home pages (ShawnChat handles those)
- `TasksCard` — col-span-2; tasks only; count header; click-to-edit inline; ↑↓ reorder with `sortPending` guard (disables all reorder buttons during any pending mutation); optimistic updates + rollback
- `RightColumnWidget` — right column; cycles between "Daily Read" (ShawnCharacter + morning note) and "Domains" (streak + weekly progress bars) via ◀ ▶; active view in localStorage; fixed min-height to prevent layout shift
- `DomainsCard` — 7-segment progress bar per domain; uses `habit_config` table when available, falls back to hardcoded [fitness, hebrew, writing]

**Layout** (`app/layout.tsx`)
- `ThemeProvider` — next-themes, system default
- `ShawnProvider` — shared chat context; morning brief fires on mount + re-fires on tab focus (30+ min gap, before 6pm); brief response saved to `/api/shawn/note`
- `ShawnChat` — floating pixel art character button (fixed bottom-right); returns `null` on `/` (ShawnStrip handles home); character state = `loading ? 'working' : 'idle'`
- `ThemeToggle` — fixed top-right

**Shawn Character** (`components/ShawnCharacter.tsx` + `lib/character.ts`)
- `lib/character.ts` — exports `CharacterState` type and `deriveCharacterState()` as plain functions with NO `'use client'` — safe to import from server components
- `components/ShawnCharacter.tsx` — `'use client'`; pixel art SVG; 5 states: idle/working/celebrating/concerned/sleeping; CSS animations in `globals.css` (not inline — React 19 warns about inline `<style>` tags)
- `deriveCharacterState(habitsDone, habitsTotal, streakAtRisk, hour)` — sleeping ≥21h, celebrating when all habits done, concerned when streak at risk, working 9-18h, idle otherwise
- Known limitation: characterState derived server-side; doesn't update in UI without page refresh (accepted for personal tool)

**Habits page** (`app/habits/page.tsx`)
- Server component; fetches habit_config + 7-day history + today's habits + streaks
- Per-domain card: today's status + 7-day dot grid + streak + weekly count
- Read-only in UI — "Your habits are managed by Shawn. Tell him to change them."

**Theme system** (`app/globals.css`)
- Light: warm off-white `#F7F5F2` background
- Dark: zinc-based dark
- All components use semantic CSS vars; accent `#CC785C` used as inline style
- Shawn character animations: `.shawn-float`, `.shawn-bounce`, `.shawn-shake` defined as global keyframes

**Sidebar** (`components/Sidebar.tsx`)
Nav links: Home, Habits, Agents, Fitness, Hebrew

### Environment
- `lib/supabase.ts` — reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
- `.env.local` is gitignored — copy values from `/Users/judahevans/Projects/shawn/.env`

### GitHub
- Life OS: https://github.com/JudahE-brand-labz/life-os.git (branch: main)
- Shawn: https://github.com/JudahE-brand-labz/Shawn.git (branch: feature/coding-sidekick)

---

## Design System

- **Dark bg**: `oklch(0.145 0 0)` (~#111)
- **Light bg**: `oklch(0.974 0.005 80)` (~#F7F5F2 warm off-white)
- **Accent**: `#CC785C` — used inline, same in both modes
- **Font**: Geist (Next.js Google font)
- **Style reference**: Raycast + Linear aesthetic — clean, minimal, no clutter
- **Icons**: lucide-react (already installed)
- **Cards**: `bg-card border border-border rounded-lg p-5`
- **Desktop only** — no mobile

---

## Architecture Notes

### Server vs client boundary
- `lib/character.ts` — NO `'use client'`; exports `deriveCharacterState` + `CharacterState`; safe for server components
- `components/ShawnCharacter.tsx` — `'use client'`; re-exports `CharacterState` type only; never import value functions from here in server components
- `app/page.tsx` imports `deriveCharacterState` from `@/lib/character` (not from ShawnCharacter)
- `RightColumnWidget` is `'use client'` — receives server-fetched data as props from page.tsx

### Why ShawnProvider is in layout.tsx
Morning brief fires once per session, survives page navigation. Both ShawnStrip (home) and ShawnChat (other pages) consume the same thread via `useShawn()`.

### Why ShawnStrip returns null on home / ShawnChat returns null on non-home
One chat surface per page. Home uses inline strip; other pages use floating button.

### Shawn's write mechanism
Shawn uses `[LOG:{...}]` markers, not direct API calls or curl. The Shawn server runs in 'chat' mode which blocks Bash — curl would fail silently. Markers are stripped from the response before it reaches the browser.

### The 5 Domains
1. **Fitness** — 4/week goal, workout logs
2. **Hebrew** (Ancient Biblical) — daily, Biblingo tool
3. **Writing** — daily, 100+ words any content
4. **Reading** — current book tracking
5. **Tasks** — daily checklist

---

## Deferred / Next Up

- Module pages (/fitness, /hebrew, /writing, /reading) with full history
- Drag-and-drop task reordering (dnd-kit) — ↑↓ buttons for now
- Shawn direct Supabase tool (after API layer is stable)
- Weekly goals + Sunday planning flow
- Nightly 3-things flow
- macOS desktop widget

---

## Key Gotchas

- `next-themes` installed with `--legacy-peer-deps` (React 19 peer dep conflict) — use same flag for new packages
- API route `app/api/tasks/[id]/route.ts`: params is a Promise in Next.js 15+ — always `await params`
- NEVER import value functions from `'use client'` modules in server components — use `lib/character.ts` for `deriveCharacterState`
- NEVER put `<style>` tags inside React components — React 19 warns; put keyframes in `globals.css`
- `sort_order` and `memories.date` columns require Step 0 migration; code degrades gracefully until then
- `habit_config` table requires Step 0 migration; DomainsCard uses hardcoded fallback until then
- Streak queries use `.maybeSingle()` not `.single()` — first-time habit logs have no streak row
- Domain whitelist in `/api/habits/log`: only ['fitness', 'hebrew', 'writing'] are valid
- `sort_order` reorder: `sortPending` boolean disables ALL ↑↓ buttons while any mutation is in-flight
- `RightColumnWidget` reads localStorage only in `useEffect` — avoids SSR hydration mismatch
- Shawn server state cache TTL is 30s; invalidated immediately after any `[LOG:]` write
