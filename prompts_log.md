ead #file:spec/FEATURE_auth.md and #file:spec/DOMAIN.md

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
     → for /api/\* routes: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   - If session AND (path === '/login' || path === '/register')
     → redirect to '/'
   - matcher config: exclude static files and \_next

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

---
