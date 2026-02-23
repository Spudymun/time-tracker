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
