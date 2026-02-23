## Промпт 0: Auth.js v5 — Настройка аутентификации

```
Read #file:spec/FEATURE_auth.md and #file:spec/DOMAIN.md

Set up Auth.js v5 authentication:

1. Install packages:
   npm install next-auth@beta @auth/prisma-adapter bcryptjs
   npm install -D @types/bcryptjs

2. Create lib/auth.ts:
   - Import NextAuth, PrismaAdapter, CredentialsProvider, GitHub, Google
   - Strategy: jwt
   - CredentialsProvider: authorize() calls validateUser(email, password)
     - validateUser(): findUnique by email, bcrypt.compare(password, passwordHash), return User or null
   - GitHub provider: { clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }
   - Google provider: { clientId: AUTH_GOOGLE_CLIENT_ID, clientSecret: AUTH_GOOGLE_CLIENT_SECRET }
   - jwt callback: add token.id = user.id when user exists
   - session callback: add session.user.id = token.id as string
   - pages: { signIn: '/login', error: '/login' }
   - Export: { auth, handlers, signIn, signOut }

3. Create app/api/auth/[...nextauth]/route.ts:
   import { handlers } from '@/lib/auth';
   export const { GET, POST } = handlers;

4. Create middleware.ts (project root):
   - Import { auth } from '@/lib/auth'
   - PUBLIC_PATHS = ['/login', '/register']
   - If !session AND !path.startsWith('/api/auth') AND !PUBLIC_PATHS.includes(path)
     → redirect to /login?callbackUrl=path (for page routes)
     → for /api/* routes: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   - If session AND (path === '/login' || path === '/register')
     → redirect to '/'
   - matcher config: exclude static files and _next

5. Extend TypeScript types — create types/next-auth.d.ts:
   declare module 'next-auth' {
     interface Session { user: { id: string } & DefaultSession['user'] }
     interface User { id: string }
   }
   declare module 'next-auth/jwt' {
     interface JWT { id: string }
   }

6. Update .env.example with AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET,
   AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET

7. Create lib/validations/auth-schema.ts:
   - RegisterSchema: { name: z.string().min(1).max(50), email: z.string().email(),
     password: z.string().min(8).max(72) }
   - LoginSchema: { email: z.string().email(), password: z.string().min(1) }

8. Create app/api/auth/register/route.ts:
   POST: validate RegisterSchema → check email uniqueness (409 if taken) →
   bcrypt.hash(password, 10) → prisma.user.create({ name, email, passwordHash }) →
   return 201 { id, name, email, createdAt } (NO passwordHash in response)

Follow #file:spec/FEATURE_auth.md
```

---

## Промпт 1: Prisma Schema + Infrastructure

```
Read #file:spec/DOMAIN.md and #file:spec/BUSINESS_RULES.md

Create the database schema and infrastructure:

1. Update prisma/schema.prisma with ALL models:

   Auth.js required models (copy EXACT field names from @auth/prisma-adapter docs):
   - User: id (cuid), name (String?), email (String? @unique), emailVerified (DateTime?),
     image (String?), passwordHash (String?), createdAt, updatedAt,
     accounts (Account[]), timeEntries (TimeEntry[]), projects (Project[]), tags (Tag[])
   - Account: standard Auth.js fields + relation to User (onDelete: Cascade)
   - VerificationToken: standard Auth.js fields

   Domain models:
   - Project: id (uuid), userId (String, FK→User onDelete:Cascade),
     name (String), color (String, default "#6366f1"),
     estimatedHours (Float?), hourlyRate (Float?), isArchived (Boolean default false),
     createdAt, updatedAt, timeEntries relation
     @@unique([userId, name])
   - Tag: id (uuid), userId (String, FK→User onDelete:Cascade),
     name (String), color (String, default "#10b981"), createdAt, timeEntries relation
     @@unique([userId, name])
   - TimeEntry: id (uuid), userId (String, FK→User onDelete:Cascade),
     description (String?), projectId (String? @db.Uuid), billable (Boolean default false),
     startedAt (DateTime), stoppedAt (DateTime?), durationSeconds (Int?),
     createdAt, updatedAt, project relation, tags relation
   - TimeEntryTag: timeEntryId, tagId, composite PK, cascade deletes on both FKs

   IMPORTANT: Project.name and Tag.name uniqueness is NOW per-user (@@unique([userId, name]))

2. Ensure lib/prisma.ts singleton uses @prisma/adapter-pg pattern from template

3. Create lib/utils/date-utils.ts:
   - startOfWeek(date: Date): Date — returns Monday
   - formatDate(date: Date): string — 'YYYY-MM-DD'
   - parseISODate(s: string): Date

4. Create lib/utils/time-format.ts:
   - formatDuration(seconds: number): string — 'h:mm:ss' or 'hh:mm:ss'
   - formatDurationShort(seconds: number): string — 'Xh Ym'
   - parseDurationInput(input: string): number | null — parses 'h:mm' → seconds, range 1..359940

Follow #file:.github/copilot-instructions.md
```

---

## Промпт 2: Validations + Repositories

```
Read #file:spec/DOMAIN.md and #file:.github/instructions/prisma.instructions.md

Create the data layer.

IMPORTANT: ALL repository methods now receive `userId: string` as a parameter.
This is REQUIRED for data isolation between users.
Never filter without userId — it would expose other users' data.

1. lib/validations/project-schema.ts — CreateProjectSchema, UpdateProjectSchema (Zod v4)
   Fields include: name, color, estimatedHours (optional float > 0), hourlyRate (optional float >= 0),
   isArchived (optional boolean, only in UpdateProjectSchema)
2. lib/validations/tag-schema.ts — CreateTagSchema, UpdateTagSchema
3. lib/validations/time-entry-schema.ts — CreateEntrySchema, UpdateEntrySchema, StopEntrySchema

4. lib/db/projects-repository.ts:
   - findAll(userId: string, filter?: { archived?: 'true' | 'false' | 'all' }): Project[] with _count
     Always add `where: { userId }` to every query
   - findById(id, userId): Project | null  — add `where: { id, userId }`
   - create(userId, data): Project
   - update(id, userId, data): Project  — findFirst({where:{id,userId}}) before update
   - delete(id, userId): void
   - archive(id, userId): Project
   - unarchive(id, userId): Project

5. lib/db/tags-repository.ts:
   - All methods receive userId: string, always filter by userId

6. lib/db/time-entries-repository.ts:
   - findMany(userId: string, filters): — always where: { userId }
   - findActive(userId: string): TimeEntry with project+tags or null
   - findById(id, userId): with project+tags or null
   - create(userId, data): with relations
   - update(id, userId, data): check ownership first
   - delete(id, userId): check ownership first
   - stopActive(id, userId, stoppedAt): check ownership

7. lib/db/task-names-repository.ts:
   - findRecent(userId: string, q?: string): string[]

Write unit test stubs in lib/validations/*.test.ts

Follow #file:.github/instructions/prisma.instructions.md
```

---

## Промпт 3: API Routes — Projects + Tags

```
Read #file:spec/FEATURE_projects.md and #file:spec/FEATURE_tags.md
Read #file:.github/instructions/api-routes.instructions.md
Read #file:spec/FEATURE_auth.md (the Auth section on how to get userId)

IMPORTANT: Every route must start with session check:
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
Then pass userId to all repository calls.

Implement API routes for Projects and Tags:

app/api/projects/route.ts:
  GET: projectsRepository.findAll(userId) → 200
  POST: validate CreateProjectSchema → projectsRepository.create(userId, data) → 201
        handle P2002 → 409

app/api/projects/[id]/route.ts:
  GET: findById(id, userId) → 404 if not found → 200
  PUT: validate UpdateProjectSchema → update(id, userId, data) → P2002 → 409
  DELETE: delete(id, userId) → 204, P2025 → 404

app/api/tags/route.ts + app/api/tags/[id]/route.ts — same pattern with userId

app/api/task-names/route.ts:
  GET ?q= → taskNamesRepository.findRecent(userId, q) → 200 with string[]

Every route:
- auth() check FIRST, before Zod parse
- Zod safeParse before DB
- NextResponse.json() with correct status
- try/catch with handlePrismaError utility

Follow #file:.github/instructions/api-routes.instructions.md
```

---

## Промпт 4: API Routes — Time Entries + Reports + Dashboard

```
Read #file:spec/FEATURE_timer.md, #file:spec/FEATURE_entries.md,
     #file:spec/FEATURE_reports.md, #file:spec/FEATURE_dashboard.md
Read #file:spec/BUSINESS_RULES.md (timer rules section)
Read #file:spec/FEATURE_auth.md (auth section)

IMPORTANT: ALL routes start with:
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

Implement:

app/api/time-entries/route.ts:
  GET ?from &to &projectId &billable → findMany(userId, filters) → 200
  POST (start timer):
    - Validate CreateEntrySchema
    - If active entry exists for this user → stop it first (stopActive with now())
    - Create new entry with userId + startedAt = now()
    - Return 201 with created entry including relations

app/api/time-entries/active/route.ts:
  GET → findActive() → 200 (null if none)

app/api/time-entries/[id]/route.ts:
  GET → findById → 404/200
  PUT → validate UpdateEntrySchema → update
       if durationMinutes provided: stoppedAt = startedAt + durationMinutes*60s
       → 200
  DELETE → check not active → delete → 204

app/api/time-entries/[id]/stop/route.ts:
  POST → stopActive(id, now()) → compute durationSeconds → 200

app/api/time-entries/[id]/continue/route.ts:
  POST → find entry → stop current active if exists → create new entry copying
         description, projectId, tagIds, billable → 201

app/api/time-entries/route.ts GET — add query params: ?tagId= and ?q= to findMany filters

app/api/reports/route.ts:
  GET ?from &to (required) → fetch entries → use reportService.buildReport() +
  reportService.buildTagReport() → merge into single response with byProject[] AND byTag[]
  Include earnings per project (billableSeconds/3600 * hourlyRate) and totalEarnings
  Projects include isArchived flag

app/api/reports/export/route.ts:
  GET ?from &to → fetch all entries for period (no 200 limit) →
  reportService.entriesToCsv() → Response with Content-Type: text/csv +
  Content-Disposition: attachment; filename=time-report-{from}_{to}.csv

app/api/dashboard/route.ts:
  GET ?from &to → build byDay, topProjects aggregation + totalEarnings
  topProjects must include earnings per project (null if no hourlyRate)

Follow #file:.github/instructions/api-routes.instructions.md
```

---

## Промпт 5: Services

```
Read #file:spec/FEATURE_reports.md

Create lib/services/report-service.ts:

function buildReport(entries: TimeEntryWithRelations[], from: Date, to: Date): ReportData
  - Groups completed entries by projectId
  - Calculates totalSeconds, billableSeconds, entryCount, percentage for each project
  - Computes earnings = billableSeconds / 3600 * project.hourlyRate (null if no rate)
  - Returns { from, to, totalSeconds, billableSeconds, totalEarnings, byProject[] }
    where totalEarnings = sum of all project earnings (null if none have a rate)
  - byProject entries include: isArchived flag, earnings field

function buildTagReport(entries: TimeEntryWithRelations[]): TagReportData
  - Groups completed entries by tag (a single entry contributes to ALL its tags)
  - Entries without tags go to group { tagId: null, tagName: null }
  - Returns byTag[]: { tagId, tagName, color, totalSeconds, billableSeconds, entryCount, percentage }

function calcEarnings(billableSeconds: number, hourlyRate: number | null): number | null
  - Returns null if hourlyRate is null; else round(billableSeconds / 3600 * hourlyRate, 2)

function entriesToCsv(entries: TimeEntryWithRelations[]): string
  - Generates CSV with headers: Date,Start,Stop,Duration (h),Project,Description,Tags,Billable
  - One row per entry
  - Tags: comma-separated in quotes
  - Billable: "Yes"/"No"
  - Duration: rounded to 2 decimal hours

function buildDashboard(entries: TimeEntryWithRelations[], from: Date, to: Date): DashboardData
  - Groups by day (Mon–Sun)
  - Groups within day by project (max 7, rest = "Other")
  - Calculates topProjects (top 5 by totalSeconds), including earnings per project
  - Computes totalEarnings (null if no project has hourlyRate)

Write tests in lib/services/report-service.test.ts with edge cases:
- Empty entries
- Single entry
- Multiple projects
- Entry with multiple tags (appears in each tag group)
- calcEarnings: null rate, zero seconds, rounding
- CSV escaping

Follow #file:.github/instructions/services.instructions.md
```

---

## Промпт 6: Stores (Zustand)

```
Read #file:spec/FEATURE_timer.md and #file:spec/FEATURE_entries.md
Read #file:.github/instructions/stores.instructions.md

Create:

lib/stores/timer-store.ts:
  State: activeEntry (TimeEntryWithRelations | null), elapsedSeconds (number), isLoading (boolean)
  Actions:
    - initTimer(): fetch /api/time-entries/active, set activeEntry
    - startTimer(data: StartTimerInput): POST /api/time-entries → set activeEntry, reset elapsed
    - stopTimer(): POST /api/time-entries/:id/stop → set activeEntry = null
    - tick(): elapsedSeconds += 1 (called from useEffect)

lib/stores/entries-store.ts:
  State: entries (TimeEntryWithRelations[]), isLoading (boolean)
  Actions:
    - fetchEntries(from, to): GET with date params
    - updateEntry(id, data): optimistic update → PUT
    - deleteEntry(id): optimistic remove → DELETE
    - continueEntry(id): POST /continue → updates timer store via setter
    - addEntry(entry): prepend to list (called from timer-store on stop)

No direct Prisma imports in stores — only fetch() calls to API routes.
```

---

## Промпт 6а: UI Примитивы + Design System

> ❗️ Этот промпт должен быть выполнен ДО любых UI-промптов (7–15). Все компоненты фич используют примитивы из `components/ui/`.

```
Read #file:spec/DESIGN_SYSTEM.md
Read #file:spec/UI_STATES.md

Install lucide-react if not present: npm install lucide-react

Create components/ui/:

Spinner.tsx — SVG-spinner, sizes: sm (16px) | md (24px) | lg (48px)
  Используется везде, где есть isLoading. Не класс, я — functional component.

Button.tsx — props: variant (primary|secondary|danger|ghost), size (sm|md|lg),
  loading (boolean), disabled (boolean)
  При loading=true — показывать <Spinner size="sm" /> + кнопка disabled
  Все интерактивные состояния: hover, focus-visible, disabled, active:scale-95
  Цвета из spec/DESIGN_SYSTEM.md (primary=indigo-600, danger=red-500, ...)

Input.tsx — base text input, props: label?, error?, + all HTMLInputElement props via forward ref
  Ошибка выводится красным текстом под полем
  focus-visible:ring-2 focus-visible:ring-indigo-500

Modal.tsx — portal modal
  Props: open, onClose, title, children
  Backdrop: bg-black/50; закрывается по Escape и клику на backdrop
  createPortal в document.body; блокирует скролл пока открыт
  aria: role="dialog" aria-modal="true" aria-labelledby={titleId}
  На мобайле: w-full rounded-t-xl (bottom sheet)

Toast.tsx + useToast hook — глобальная система уведомлений
  useToast() возвращает { toast: { success, error, info } }
  Auto-dismiss: 3с (success/info), 5с (error)
  Макс. 3 одновременных; позиция: правый нижний угол
  role="alert" для screen readers
  ToastProvider добавить в app/layout.tsx

Badge.tsx — variant: default | archived | billable
TagChip.tsx — props: name, color (#RRGGBB), onRemove? — переиспользуется в TimerBar TagSelect и EntryItem

Create lib/utils/api-client.ts:
  export async function apiFetch(url: string, options?: RequestInit): Promise<Response>
  Если res.status === 401:
    window.location.href = '/login';  // полный редирект, не router.push
    throw new Error('Unauthorized');
  Все Zustand stores используют apiFetch вместо fetch напрямую

Rules (from spec/DESIGN_SYSTEM.md):
- NO inline style={{}} except dynamic colors (e.g., style={{ backgroundColor: project.color }})
- NO bare <button> elements outside Button.tsx
- ALL loading states use <Spinner />, never "Loading..." text
- ALL interactive elements MUST have hover + focus-visible + disabled styles

Follow #file:spec/DESIGN_SYSTEM.md
```

---

## Промпт 7: UI — TimerBar (хедер таймера)

```
Read #file:spec/FEATURE_timer.md (components section)

Create components/timer/:

BillableToggle.tsx — simple checkbox/"$" icon toggle, props: checked, onChange
TagSelect.tsx — multi-select dropdown with search. Props: value: string[], onChange, tags: Tag[]
  - Shows selected tags as TagChip components
  - Dropdown with search input, checkboxes
  - "No tags" empty state

ProjectSelect.tsx — dropdown select for project. Props: value: string|null, onChange, projects: Project[]
  - Shows project color dot + name
  - "No project" option at top

TaskAutocomplete.tsx — input field with dropdown suggestions
  - Fetches /api/task-names?q= on input change (debounce 300ms)
  - Keyboard navigation (arrows + Enter)
  - Clears on timer stop

TimerDisplay.tsx — "use client", shows hh:mm:ss
  - useEffect + setInterval(1000)
  - Reads elapsedSeconds from timer-store

TimerControls.tsx — Start/Stop button
  - "Start" (green) when idle, "Stop" (red) when running
  - Shows loading spinner during API call

TimerBar.tsx — horizontal bar, always in layout header
  - Fetches projects and tags on mount for selects
  - Uses timer-store
  - Layout: [TaskAutocomplete] [ProjectSelect] [TagSelect] [BillableToggle] [TimerDisplay] [TimerControls]

Integrate TimerBar into app/layout.tsx

Follow #file:.github/instructions/components.instructions.md
```

---

## Промпт 8: UI — Entries List

```
Read #file:spec/FEATURE_entries.md

Create components/entries/:

TagChip.tsx — colored chip showing tag name, optional onRemove prop
  Reuse in TimerBar TagSelect and EntryItem

EntryDurationInput.tsx — inline input, format hh:mm, validates range 00:01-99:59

EntriesFilterBar.tsx — filter panel above entries list
  Props: onChange(filters: EntriesFilter)
  Fields: text search (q), ProjectSelect, TagSelect (single), billable toggle
  "Clear" button visible when any filter is active
  Filters combine as AND, updates query params sent to fetchEntries

EntryItem.tsx — two modes:
  Display: [project color dot] [description or "(no description)"] [tags chips] [$ billable icon if true] [duration] [Continue btn] [Edit btn] [Delete btn]
  Edit: inline form with all fields editable (description, ProjectSelect, TagSelect, BillableToggle, EntryDurationInput)
  Archived project shown with (archived) label in edit mode
  Transitions smoothly between modes

EntriesProjectGroup.tsx — project header with total time for this group on this day
EntryDeleteConfirm.tsx — inline yes/no confirmation

EntriesDayGroup.tsx — date header ("Today", "Yesterday", date), total for day, list of ProjectGroups

EntriesList.tsx — loads from entries-store with active filters,
  groups by date → project, infinite scroll or load more
  Passes filter state to EntriesFilterBar; re-fetches on filter change

Connect to app/(main)/page.tsx below DashboardWidget
```

---

## Промпт 9: UI — Dashboard

```
Read #file:spec/FEATURE_dashboard.md

Install recharts if not already: npm install recharts

Create components/dashboard/:

WeeklyBarChart.tsx — Recharts stacked BarChart
  - 7 bars (Mon–Sun)
  - Stacked by project
  - X axis: day labels; Y axis: hours
  - Tooltip: shows breakdown per project
  - Responsive container

TopProjectsList.tsx — ordered list of top 5 projects
  - Color swatch + name + hours (+ earnings if hourlyRate set)
  - Mini progress bar relative to #1

WeeklySummary.tsx — "Total: Xh Ym" + "Billable: Xh Ym"
  - If totalEarnings is not null: additional line "Earned: $X,XXX"

WeeklyTargetBar.tsx — optional progress bar toward weekly goal
  - Reads weeklyTargetHours from localStorage (key: 'weeklyTargetHours')
  - Shows editable input (on click) to set the target
  - Progress bar: green 0–79%, yellow 80–99%, blue ≥100%
  - Hidden if no target set

DashboardCompact.tsx — compact view when scrolled past
  - Shows only "Xh Ym this week" text in a sticky bar
  - Toggle visibility via IntersectionObserver on DashboardWidget

DashboardWidget.tsx — fetches /api/dashboard, navigation ‹ ›, link to reports
  - Renders WeeklyBarChart + WeeklySummary + WeeklyTargetBar + TopProjectsList
  - Uses DashboardCompact when scrolled off screen

Connect to app/(main)/page.tsx above EntriesList
```

---

## Промпт 10: UI — Projects Page

```
Read #file:spec/FEATURE_projects.md

Create components/projects/:

ColorPicker.tsx — grid of 12 preset colors + custom HEX input field
  Validates /^#[0-9A-Fa-f]{6}$/ on blur

ProjectEstimateBar.tsx — progress bar for time budget
  Props: estimateProgress (number | null)
  Hidden if estimateProgress is null
  Colors: green (0–0.79), yellow (0.80–0.99), red (≥1.0)
  Shows label: "Xh / Yh (ZZ%)"

ProjectForm.tsx — compact inline form:
  - name input + ColorPicker + Save/Cancel buttons
  - optional estimatedHours input (number, > 0)
  - optional hourlyRate input (number, >= 0)

ProjectDeleteConfirm.tsx — modal or inline confirm with warning about
  unassigned entries count

ProjectItem.tsx — display: [color dot] [name] [Xh total] [billable Xh]
                            [ProjectEstimateBar if estimate set]
                            [earnings if hourlyRate set] [entry count]
                            [Archive/Unarchive btn] [Edit] [Delete]
               edit: inline ProjectForm
               archived projects: shown with (archived) label, muted style

ProjectsList.tsx — renders active projects by default
  "New project" button at top
  Toggle "Show archived" — re-fetches with ?archived=true, appended at bottom

Create app/projects/page.tsx — server component fetching projects
```

---

## Промпт 11: UI — Tags Page

```
Read #file:spec/FEATURE_tags.md

Create components/tags/:
- TagForm.tsx — name + ColorPicker compact form
- TagItem.tsx (display + edit)
- TagsList.tsx

Create app/tags/page.tsx

Update TagSelect.tsx if needed — allow "Create new tag" option inline in dropdown
  POST /api/tags → add to list → select it
```

---

## Промпт 12: UI — Reports Page

```
Read #file:spec/FEATURE_reports.md

Create components/reports/:

PeriodSelector.tsx — Today / This Week / This Month / Custom
  Custom: two date inputs (from, to)
  Emits { from: Date, to: Date } to parent

ReportViewToggle.tsx — toggles between "By Projects" and "By Tags" view
  Props: value: 'projects' | 'tags', onChange

ReportProjectRow.tsx — expandable row
  Collapsed: project color + name + billable hours + total hours + %
             + earnings column (only if any project has hourlyRate)
  Expanded: list of individual entries for this project
  Archived projects shown with (archived) badge

ReportTagRow.tsx — expandable row (same pattern as ProjectRow but for tags)
  Collapsed: tag color + name + billable hours + total hours + %
  Expanded: list of individual entries with this tag
  "No tag" group at bottom

ReportTable.tsx — receives viewMode prop, renders ProjectRows or TagRows,
  total footer row. Shows earnings column header only if totalEarnings != null

ExportButton.tsx — fetches /api/reports/export?from=&to= as blob download
  loading state during fetch

ReportsPage.tsx — client component
  State: period + reportData + viewMode ('projects' | 'tags')
  Renders: PeriodSelector + ReportViewToggle + ReportTable + ExportButton

Create app/reports/page.tsx
```

---

## Промпт 13: Navigation + Layout

```
Update app/layout.tsx:
- Add TimerBar in header (sticky top-0)
- Add navigation: Home (/) | Projects (/projects) | Tags (/tags) | Reports (/reports)
- Use active link highlighting

Ensure all pages have consistent layout padding below header
```

---

## Промпт 14: UI общие компоненты (components/ui/)

```
> NOTE: Button, Input, Modal, Toast, Badge, Spinner, TagChip уже созданы в Промпте 6а.
> В этом промпте: проверить и дополнить если что-то пропущено.

Read #file:spec/DESIGN_SYSTEM.md

Verify all components/ui/ are complete:
- Spinner.tsx — sizes sm|md|lg
- Button.tsx — variants + loading + disabled states
- Input.tsx — label + error + forward ref
- Modal.tsx — portal + Escape + backdrop click + scroll lock + aria
- Toast.tsx + useToast hook — success/error/info, auto-dismiss 3s/5s
- Badge.tsx — variant: default|archived|billable
- TagChip.tsx — color + name + optional onRemove
- Select.tsx — customizable base select

Verify lib/utils/api-client.ts exists with 401 interceptor.

If any component is missing or incomplete — implement it now.
All components: typed props, no `any`, forward refs where needed.

Follow #file:spec/DESIGN_SYSTEM.md
```

---

## Промпт 15: UI — Auth Pages (Login + Register)

```
Read #file:spec/FEATURE_auth.md

Create app/(auth)/layout.tsx:
  - Centered layout (NO TimerBar, NO main navigation)
  - Logo / app name centered at top
  - Full-height centered card

Create components/auth/:
  OAuthButton.tsx — button with provider icon (GitHub/Google), loading state
    Props: provider: 'github' | 'google', onClick: () => void, isLoading: boolean

  LoginForm.tsx — "use client"
    - Fields: email, password
    - Submit: signIn('credentials', { email, password, callbackUrl: searchParams.get('callbackUrl') || '/' })
    - On error: show toast with "Invalid credentials"
    - GitHub OAuth button → signIn('github')
    - Google OAuth button → signIn('google')
    - Link to /register

  RegisterForm.tsx — "use client"
    - Fields: name, email, password, confirmPassword
    - Submit: POST /api/auth/register → on success signIn('credentials', ...)
    - Show 409 as toast: "Email already in use"
    - Link to /login

Create app/(auth)/login/page.tsx — renders LoginForm
Create app/(auth)/register/page.tsx — renders RegisterForm

Create components/ui/UserMenu.tsx — "use client"
  - Shows: user avatar (image or initials), name
  - Dropdown on click: user email (muted), divider, "Sign out" button
  - Sign out: signOut({ callbackUrl: '/login' })

Update app/layout.tsx:
  - Import UserMenu, render in header (right side)
  - Session provider NOT needed with Auth.js v5 (uses server-side auth())

Follow #file:.github/instructions/components.instructions.md
```

---

## Промпт 16а: Системные страницы + Обработка ошибок

```
Read #file:spec/UI_STATES.md

Create system Next.js pages and loading states:

1. app/not-found.tsx — glобальная 404 страница
   - Centered layout (no TimerBar needed — use a minimal wrapper)
   - Show: icon + "Page not found" + description + Button "Go to Dashboard" href="/"
   - NOT a client component (pure server)

2. app/error.tsx — global error boundary
   MUST be "use client" (Next.js requirement)
   Props: { error: Error & { digest?: string }, reset: () => void }
   - Show: icon + "Something went wrong" + description
   - Button "Try again" calls reset()
   - Button "Go to Dashboard" → href="/" — use Link, not router.push

3. app/global-error.tsx — root layout error boundary
   "use client"
   Minimal HTML with <html><body>: heading + "Reload" button → window.location.reload()

4. Loading states (each is an async Server Component with Suspense-compatible skeleton):

   app/loading.tsx
   - Full-screen centered <Spinner size="lg" />

   app/(main)/loading.tsx
   - Skeleton: gray DashboardWidget placeholder (h-[280px] animate-pulse rounded-lg)
   - 3 skeleton entry rows

   app/projects/loading.tsx
   - Skeleton: "New project" button placeholder + 4 project item rows (dot + text blocks), animate-pulse

   app/reports/loading.tsx
   - Skeleton: period selector placeholder + 5 table rows, animate-pulse

   app/(auth)/login/loading.tsx and app/(auth)/register/loading.tsx
   - Centered <Spinner size="md" />

5. Update stores to use apiFetch (from lib/utils/api-client.ts) instead of fetch:
   - lib/stores/timer-store.ts: replace all fetch(...) with apiFetch(...)
   - lib/stores/entries-store.ts: replace all fetch(...) with apiFetch(...)
   This ensures 401 responses redirect to /login automatically.

Follow #file:spec/UI_STATES.md
```

---

## Промпт 16: Финальная проверка

```
Review implementation against all specs:

1. Read #file:spec.md — are all #functional requirements implemented?
2. Read #file:spec/BUSINESS_RULES.md — are all rules enforced?
3. Read #file:spec/DESIGN_SYSTEM.md — check design consistency:
   - NO inline style={{}} except dynamic colors
   - All loading states use <Spinner />
   - All interactive elements have hover/focus/disabled states
   - Button/Input/Modal/Toast from components/ui/ everywhere
4. Read #file:spec/UI_STATES.md — check all states are implemented:
   - app/not-found.tsx, app/error.tsx, app/global-error.tsx exist
   - Per-page loading.tsx files exist
   - Empty states for EntriesList, ProjectsList, TagsList, ReportTable, Dashboard
   - Error states with Retry in EntriesList, Dashboard, Reports
   - lib/utils/api-client.ts used in all stores (401 interceptor)
5. Read #file:spec/FEATURE_auth.md — check auth integration:
   - Every API route has `const session = await auth(); if (!session) return 401`
   - Repositories always filter by userId
   - middleware.ts exists and protects all non-public routes
   - login/register pages render without TimerBar
   - UserMenu visible in main layout
6. Read each #file:spec/FEATURE_*.md — are all edge cases handled?
7. Check: only one active timer per user (not globally)
8. Check: accessing /api/projects without session → 401
9. Check: CSV export works (0 entries → headers only; from>to → 400)
10. Check: TagSelect blocks adding 11th tag (tooltip «Maximum 10 tags»)
11. Check: WeeklyTargetBar reads localStorage in useEffect (no hydration mismatch)
12. Check: OAuth login creates User + Account

Run: npm run type-check, npm run lint, npx vitest run
Report all gaps. Fix them.
```

---

## Промпт 17

```
Задача: твоя роль QA manual.
теперь нужно сделать todo но уже для проверки работы приложения. Должно быть охвачено все что только проверяет синьор в контексте нашего приложения(смотри спеку).
```

---

## Промпт 18

```
Задача: запустить и проверить то что можешь проверить своими инструментами из E:\project\time-tracker\QA_CHECKLIST.md. То что не можешь проверить пометь как не смог и я проверю сам.
```

---

## Промпт 19

```
Я против давай не избегать проблемы, а решать её. Проведи исследование в интернете этой проблемы.
```

---

## Промпт 20

```
Продолжай теперь как мануальны
```

---

## Промпт 21

```
GET /api/auth/session 200 in 37ms
 GET /login 200 in 262ms
 GET /api/auth/session 200 in 39ms
 GET /login 200 in 231ms
 GET /api/auth/session 200 in 32ms
 GET /login 200 in 258ms
 GET /api/auth/session 200 in 33ms
 GET /login 200 in 264ms
 GET /api/auth/session 200 in 34ms
 GET /login 200 in 253ms
 GET /api/auth/session 200 in 90ms
 GET /login 200 in 302ms
 GET /api/auth/session 200 in 49ms
 GET /login 200 in 301ms
 GET /api/auth/session 200 in 24ms
 GET /login 200 in 234ms
 GET /api/auth/session 200 in 38ms
 GET /login 200 in 278ms
 постоянные переключения. Это ошибка на уровне логики работы приложения
```

## Промпт 22

```
Нужно найти причину сообщения на скрине об утечки пароля и разрешить правильной реализацией.
```
