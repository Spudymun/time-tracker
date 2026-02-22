# Feature: Authentication

> Создан: 2026-02-22
> Статус: Ready
> Источник требований: продуктовое решение — personal tool с защитой данных и поддержкой multi-user

---

## Обзор

**Актор:** Незарегистрированный / незалогиненный посетитель  
**Цель:** Создать аккаунт или войти, чтобы получить доступ к своим данным  
**MVP приоритет:** Must Have

**Почему auth в MVP, а не "следующая итерация":**  
Без аутентификации приложение на публичном URL (Vercel) — полностью открытое.  
Любой знающий ссылку может читать, удалять и изменять данные. Это неприемлемо.  
Даже для personal-tool auth обязателен при деплое.

---

## Стек аутентификации

| Компонент | Выбор | Обоснование |
|-----------|-------|-------------|
| Auth framework | **Auth.js v5** (`next-auth@beta`) | Нативная поддержка Next.js 15 App Router, активная поддержка, официальная документация |
| Providers | Credentials (email+password) + GitHub OAuth + Google OAuth | Credentials для простоты; GitHub/Google для удобства разработчиков |
| Session strategy | **JWT** | Отсутствие Session-таблицы в БД, быстрее на serverless (Neon.tech), подходит для personal tool |
| Password hashing | **bcryptjs** | Стандарт, проверенный, pure JS (работает в Edge) |
| Prisma adapter | **@auth/prisma-adapter** | Сохраняет User + Account (OAuth linking) в БД |
| DB tables | User, Account, VerificationToken | Стандарт Auth.js Prisma adapter |

---

## Пользовательские сценарии

### Сценарий A — Регистрация через email+password

1. Пользователь открывает `/register`
2. Вводит имя, email, пароль (min 8 символов)
3. Клик «Create account»
4. Сервер: хеширует пароль bcrypt(10), создаёт User, возвращает сессию
5. Редирект на главную страницу `/`

### Сценарий B — Вход через email+password

1. Пользователь открывает `/login`
2. Вводит email + пароль
3. Клик «Sign in»
4. Сервер: находит User по email, проверяет bcrypt → выдаёт JWT
5. Редирект на страницу с которой пришёл (или `/`)

### Сценарий C — OAuth (GitHub / Google)

1. Пользователь нажимает «Continue with GitHub» / «Continue with Google»
2. Редирект на OAuth provider
3. При первом входе — создаётся User + Account (OAuth linking)
4. При повторном — находится существующий User через Account
5. Редирект на `/`

### Сценарий D — Выход

1. Пользователь нажимает на свой аватар/имя в хедере
2. Появляется дропдаун: имя + email + кнопка «Sign out»
3. Клик «Sign out» → `signOut()` → редирект на `/login`

### Сценарий E — Защищённые маршруты

1. Пользователь открывает `/projects` (или любой `/`) без сессии
2. Middleware перехватывает запрос → редирект на `/login?callbackUrl=/projects`
3. После входа — редирект обратно на `/projects`

---

## Компоненты / Страницы

### Страницы (app/(auth)/)

| Маршрут | Компонент | Описание |
|---------|-----------|---------|
| `/login` | `LoginPage` + `LoginForm` | Email/password + OAuth кнопки |
| `/register` | `RegisterPage` + `RegisterForm` | Email + name + password + confirm |

Эти страницы в отдельной route group `(auth)` — без TimerBar в layout.  
`app/(auth)/layout.tsx` — центрированный layout (logo + centered card).

### UI компоненты

| Компонент | Описание |
|-----------|---------|
| `LoginForm.tsx` | React Hook Form + Zod; показывает `signIn` error toast |
| `RegisterForm.tsx` | React Hook Form + Zod; POST `/api/auth/register` |
| `OAuthButton.tsx` | Кнопка с иконкой провайдера (GitHub, Google), loading state |
| `UserMenu.tsx` | В хедере: аватар/инициалы, имя, email, «Sign out» дропдаун |

---

## API

### Новые эндпоинты

| Method | Route | Описание |
|--------|-------|---------|
| POST | `/api/auth/register` | Регистрация: `{ name, email, password }` → создаёт User с bcrypt hash |
| `*` | `/api/auth/[...nextauth]` | Auth.js handler — всё остальное (login, OAuth callback, signout) |

### Изменение существующих

Все API routes (`/api/projects`, `/api/tags`, `/api/time-entries`, etc.) теперь:
1. Извлекают `userId` из сессии: `const session = await auth(); if (!session) return 401`
2. Передают `userId` во все вызовы репозиториев

### Схема регистрации (POST /api/auth/register)

```typescript
{
  name: string;      // 1-50 символов
  email: string;     // valid email, lowercase
  password: string;  // min 8 символов, max 72 (bcrypt limit)
}
```

Ответ `201`: `{ id, name, email, createdAt }`  
Ошибка: `409` если email уже занят

---

## Middleware

Файл: `middleware.ts` (корень проекта)

```typescript
// Защищённые маршруты: все кроме /login, /register, /api/auth/*
// Публичные: /login, /register, /api/auth/**
```

Логика:
- Если нет сессии AND маршрут не публичный → `redirect('/login?callbackUrl=...')`
- Если есть сессия AND маршрут `/login` или `/register` → `redirect('/')`
- API routes без сессии → `{ error: 'Unauthorized' }` с `status: 401`

---

## lib/auth.ts (конфигурация Auth.js)

```typescript
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({ ... }),  // validateUser(email, password) → User | null
    GitHub({ ... }),
    Google({ ... }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;  // добавляем userId в JWT
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;  // доступен в auth()
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
```

---

## Изменения в Domain (влияние на другие сущности)

### userId на всех основных сущностях

Все domain-entities получают `userId` FK:

```
User ──< Project      (one-to-many)
User ──< Tag          (one-to-many)
User ──< TimeEntry    (one-to-many)
```

**Последствия:**
- `Project.name` уникально **per-user** (не глобально) → Prisma constraint: `@@unique([userId, name])`
- `Tag.name` уникально **per-user** → `@@unique([userId, name])`
- "Одна активная запись" — per-user, не глобально
- Все `findMany`, `findAll`, `findActive` получают `userId` параметр

### Изменение поведения при удалении

Добавляется:
| Родитель | Поведение |
|----------|-----------|
| User удалён | Project Cascade, Tag Cascade, TimeEntry Cascade |

---

## Edge Cases

| Случай | Поведение |
|--------|-----------|
| Неверный пароль | Credentials error → `"Invalid credentials"` toast, нет 404/200 leak |
| Email занят при регистрации | 409 → `"Email already in use"` |
| OAuth email совпадает с Credentials email | Auth.js OAuthAccountNotLinked error → `/login?error=OAuthAccountNotLinked` → показать `"Войдите с email/паролем для этого аккаунта"` |
| JWT истёк (навигация) | Middleware обнаружит отсутствие сессии → редирект `/login?callbackUrl=...` |
| JWT истёк (пользователь на странице, fetch() возвращает 401) | Zustand store получает 401 → `toast.error("Session expired. Please sign in.")` + `window.location.href = '/login'`. Реализуется через `lib/utils/api-client.ts#apiFetch` |
| Пользователь удалён во время активной сессии | JWT всё ещё валиден до истечения; при DELETE репозиторий выбросит FK violation → 401 |
| Попытка доступа к чужому ресурсу (PUT /api/projects/[id]) | Repository фильтрует по userId → 404 (не 403, чтобы не раскрывать наличие записи) |
| Пустой email у OAuth provider | Auth.js обработает, email nullable в User — допустимо |

---

## Правила безопасности

- `passwordHash` никогда не возвращается в API responses
- JWT secret — `AUTH_SECRET` env var (min 32 символа), никогда в коде
- OAuth credentials — `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `bcryptjs` rounds = 10 (баланс между безопасностью и производительностью)
- При переборе паролей: Auth.js v5 не добавляет rate limiting из коробки; для MVP достаточно (personal tool)
- Авторизация: каждый repository-вызов использует `userId` из сессии, **никогда из тела запроса**

---

## Переменные окружения (добавить в .env.example)

```
AUTH_SECRET=your-32-char-secret-here         # openssl rand -base64 32
AUTH_GITHUB_ID=your-github-oauth-app-id
AUTH_GITHUB_SECRET=your-github-oauth-app-secret
AUTH_GOOGLE_CLIENT_ID=your-google-client-id
AUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Тестовый план

| Сценарий | Тип | Описание |
|----------|-----|---------|
| RegisterSchema | Unit | name/email/password валидация |
| Неверный пароль | Unit | `validateUser()` возвращает null |
| Правильный пароль | Unit | `validateUser()` возвращает User |
| bcrypt hash не совпадает | Unit | `compare()` = false |
| Email uniqueness | Integration | 409 при дублировании |
| Unauthorised API | Manual | `/api/projects` без сессии → 401 |
| Middleware redirect | Manual | `/projects` без сессии → `/login?callbackUrl=...` |
| OAuth happy path | Manual | GitHub → создание User + Account |
