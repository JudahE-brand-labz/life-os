@AGENTS.md

# Life OS

A personal operating system — a Next.js dashboard that orchestrates Judah's daily habits, goals, and progress across 5 life domains. Shawn (the AI agent, at `/Users/judahevans/Projects/shawn`) is the kernel. This is a deeply personal tool built to last, not a generic productivity app.

Full design blueprint is in the Obsidian vault:
`/Users/judahevans/Documents/Judah Idea Network/Life OS Blueprint.md`

Read that file for the full vision before starting any significant work.

---

## Current State (as of May 2026)

### What's built and working
- **Shawn HTTP server** (`/Users/judahevans/Projects/shawn/src/server.ts`) — Express server on `:4242`. Start with `npm run serve` from the shawn project. Life OS calls this for all Shawn communication.
  - `POST /relay` → sends message to Shawn AI, returns response, strips `[LOG: {...}]` markers and writes habit data to Supabase
  - `GET /status` → returns session info
- **Supabase schema** — tables created in project `adsyromvklfqlbmfcgdg`: `habits`, `streaks`, `fitness_sessions`, `writing_logs`, `hebrew_sessions`, `reading_log`, `tasks`, `weekly_goals` (seeded with defaults: fitness 4/wk, hebrew/writing 7/wk)
- **Life OS data layer** (`lib/db.ts`) — typed server-side query functions: `getTodayHabits()`, `getStreaks()`, `getThisWeekProgress()`, `getTodayTasks()`
- **Home page** (`app/page.tsx`) — async server component fetching all data in parallel, renders:
  - `Greeting` — "Good morning/afternoon/evening, Judah" + date
  - `TodayCard` — habit checklist (Workout, Write, Hebrew) + today's tasks, live from Supabase
  - `ThisWeekCard` — progress bars per domain vs weekly goals, live from Supabase
  - `StreaksCard` — current streak per domain, live from Supabase
  - `ShawnGreeting` — client component, on mount sends morning brief request to Shawn, shows response in persistent bottom card, expandable to full chat
- **ShawnChat** — floating `S` button stays on all pages (layout.tsx), always accessible
- **Shawn logging** — Shawn's `brain/RULES.md` instructs him to append `[LOG: {...}]` markers when logging completions. Server strips and routes to correct Supabase table. Supported types: `fitness_session`, `writing_log`, `hebrew_session`, `task_update`, `tasks_add`

### To start the app
```
# Terminal 1 — Shawn server
cd ~/Projects/shawn && npm run serve

# Terminal 2 — Life OS
cd ~/Projects/life.os && npm run dev
```
Then open http://localhost:3000

### Environment
- `lib/supabase.ts` — reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
- `.env.local` is gitignored — credentials are in `/Users/judahevans/Projects/shawn/.env` (same Supabase project)

### Not Yet Built (Priority Order)
1. ~~Supabase integration + schema~~ ✓ Done
2. Smarter Shawn (never-miss-twice logic, proactive Calendar-linked check-ins)
3. Home page redesign (light/dark mode toggle, visual polish)
4. Tasks page
5. Module pages with actual content (Fitness, Hebrew, Writing, Reading)
6. Light/dark mode toggle
7. macOS desktop widget (read-only status, Shawn proactive notifications)
8. Weekly goals system
9. Sunday planning flow
10. Nightly 3-things flow

---

## Planned Architecture

### Data Layer
**Supabase (Postgres)** — single source of truth for all structured data:
- `habits` — daily completions (writing, Hebrew, workout)
- `streaks` — current and longest streak per domain
- `fitness_sessions` — workout logs (date, type, duration)
- `nutrition_logs` — rough daily food log
- `hebrew_sessions` — study logs (date, duration, focus area)
- `tutor_sessions` — Bret meeting notes (every 2 weeks)
- `writing_logs` — daily writing completions + word count
- `reading_log` — books (current, finished, rating, one-sentence review)
- `tasks` — daily checklist items with date and completion status
- `weekly_goals` — per-domain weekly targets (defaults carry forward)

### The 5 Domains

**1. Fitness**
- Workouts: default 4/week goal
- Nutrition: rough daily log (not calorie counting)
- Meal prep: weekly planning section

**2. Hebrew (Ancient Biblical)**
- Tool: Biblingo (no API — all via Shawn conversation)
- Tutor: Bret, every other week — Shawn preps reminders 1-2 days before
- Tracking: did it (yes/no), duration, focus area (vocab/grammar/reading/speaking), session notes
- Default: daily sessions

**3. Writing**
- Now: daily habit tracker (100+ words, any content)
- Summer: newsletter module (content calendar, draft tracking)
- Default: every day

**4. Reading**
- Current book tracking + book shelf
- One-sentence review when finished
- No count goal — just keep a book going

**5. Tasks**
- Daily checklist (migrated from Obsidian — Life OS is the single source of truth)
- Nightly 3-things check-in sets tomorrow's list
- Never-miss-twice applies to all tasks

### Shawn's Role
Shawn is the kernel — he runs the session, not the user.
- Opens Life OS → Shawn leads, surfaces what needs attention
- Logging is always conversational (Shawn asks → Judah answers → Shawn routes to Supabase)
- Never-miss-twice: missed yesterday = top of today's check-in, escalated if missed twice
- Sunday morning: week planning (5 min, confirm/adjust weekly goals)
- Nightly: "What are your 3 things for tomorrow?" — populates tomorrow's task card
- Catch-up mode: been gone days? Shawn fills gaps with no guilt

**Shawn's personality**: Direct with warmth. Brief. "Lock in" energy when behind. Genuine celebration when on track. Never nagging.

### Home Page Layout
```
┌─────────────────────────────────────────────────┐
│  Good morning, Judah  •  Monday, May 4          │
│                                                 │
│            [ JUDAH AVATAR/CARICATURE ]          │
│                                                 │
├───────────────┬─────────────────┬───────────────┤
│  TODAY        │  THIS WEEK      │  STREAKS      │
│  ─────────    │  ────────────   │  ─────────    │
│  ☐ Hebrew     │  Writing  4/7   │  ✍ 4 days    │
│  ☑ Workout    │  Hebrew   3/5   │  📖 3 days   │
│  ☐ Write      │  Workouts 3/4   │  💪 3 days   │
├───────────────┴─────────────────┴───────────────┤
│  💬 Shawn: "Hebrew is waiting. Lock in."        │
└─────────────────────────────────────────────────┘
```

Shawn's bottom card escalates visually when there's a never-miss-twice flag. Stays subtle and warm when things are good. Click to expand full chat.

### Module Pages
Each domain page is visual but not overwhelming:
- **Fitness**: workout calendar dots, session history, nutrition log, meal prep
- **Hebrew**: study streak, session history, upcoming Bret session + prep notes
- **Writing**: streak, weekly word count bar chart, monthly total
- **Reading**: currently reading card, finished shelf, reviews
- **Tasks**: today's list, week view by day, completed archive

### Design System
- **Dark mode**: `#111` background, zinc grays (current)
- **Light mode**: `~#F7F5F2` warm off-white
- **Accent**: `#CC785C` (already in codebase — keep it)
- **Font**: Geist (already in codebase — keep it)
- **Style reference**: Raycast + Linear aesthetic
- **Full light/dark mode toggle** to be added

### Delivery
- Shawn lives in the Life OS browser widget (bottom card on home, expands to chat)
- macOS desktop widget: read-only status display (streaks, today's state)
- Desktop only — no mobile

### Not Yet Built (Priority Order)
1. Supabase integration + schema
2. Smarter Shawn (never-miss-twice logic, proactive opening message)
3. Home page redesign (avatar, card grid, Shawn bottom card)
4. Tasks page
5. Module pages with actual content (Fitness, Hebrew, Writing, Reading)
6. Light/dark mode toggle
7. macOS desktop widget
8. Weekly goals system
9. Sunday planning flow
10. Nightly 3-things flow

### Future (Not Now)
- Voice for Shawn (ElevenLabs or OpenAI realtime API)
- Newsletter module (summer — plugs into Writing domain)
- Mobile
