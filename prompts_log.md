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