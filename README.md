# [PROJECT_NAME] — Template

Production-ready шаблон для spec-driven разработки с GitHub Copilot.
Стек: Next.js 15, TypeScript strict, TailwindCSS v4, Prisma v7, Zod, Vitest.

## Что включено

```
.github/
  copilot-instructions.md          # Always-on: tech stack, конвенции
  instructions/
    ai-agent-rules.instructions.md # Правила поведения агента
    typescript.instructions.md     # TS/React стандарты
    api-routes.instructions.md     # API паттерны
    tests.instructions.md          # Vitest конвенции
    prisma.instructions.md         # Prisma/DB паттерны
  agents/
    planner.agent.md               # Агент-планировщик (read-only)
    reviewer.agent.md              # Агент code review
  prompts/
    new-feature.prompt.md          # /new-feature slash command
    spec-review.prompt.md          # /spec-review slash command
    new-component.prompt.md        # /new-component slash command
  skills/
    spec-driven/SKILL.md           # Skill: spec-driven workflow
    db-operations/SKILL.md         # Skill: репозитории и Prisma

.vscode/
  mcp.json                         # MCP серверы (auto-launch)
  settings.json                    # VS Code + Copilot настройки
  extensions.json                  # Рекомендуемые расширения

spec/
  VISION.md                        # Что и зачем
  DOMAIN.md                        # Сущности и связи
  ARCHITECTURE.md                  # Архитектурные решения
  BUSINESS_RULES.md                # Бизнес-правила
  FEATURE_template.md              # Шаблон спецификации фичи

mcp/
  server.ts                        # Custom MCP server (TypeScript)
  package.json / tsconfig.json
  README.md

eslint.config.mjs                  # ESLint flat config
prettier.config.js                 # Prettier + TailwindCSS plugin
next.config.ts                     # Security headers
package.json                       # Все скрипты
prisma/schema.prisma               # Шаблон Prisma схемы
spec.md / prompt_plan.md / todo.md # Spec-driven workflow файлы
```

---

## Начало нового проекта

### Шаг 1: Скопируй шаблон

```bash
cp -r E:\project\vibe-coder-template E:\project\your-project
cd E:\project\your-project
```

### Шаг 2: Настрой окружение

```bash
# Установи зависимости проекта
npm install

# Скопируй и заполни .env.local
cp .env.example .env.local
# → DATABASE_URL=postgresql://...
```

### Шаг 3: Собери MCP сервер

```bash
npm run mcp:build
```

После этого VS Code автоматически запустит MCP сервер при следующем открытии.

### Шаг 4: Заполни spec

1. Открой `spec/VISION.md` — опиши что строишь и для кого
2. Открой `spec/DOMAIN.md` — опиши сущности и связи
3. Открой `spec/BUSINESS_RULES.md` — опиши правила
4. Создай `spec/FEATURE_{name}.md` для каждой фичи (скопируй из `FEATURE_template.md`)
5. Заполни корневой `spec.md` через Harper Reed workflow (см. ниже)

### Шаг 5: Обнови `.github/copilot-instructions.md`

Замени плейсхолдеры `[PROJECT_NAME]` на реальное название проекта.

### Шаг 6: Начни разработку

Открой VS Code Agent Mode → используй prompts:
- `/new-feature {name}` — реализовать фичу по spec
- `/spec-review` — сравнить реализацию со spec
- `/new-component {name}` — создать компонент

Или используй `@planner` для планирования перед реализацией.

---

## Harper Reed Workflow (spec-driven)

### Этап 1: Brainstorm → spec.md

Используй ChatGPT/Claude с промптом:
```
Ask me one question at a time so we can develop a thorough, step-by-step spec
for this idea. Our end goal is a detailed specification I can hand off.
Only one question at a time.

Here's the idea: [DESCRIBE YOUR IDEA]
```

После сессии:
```
Now compile our findings into a developer-ready specification with all
requirements, architecture choices, error handling, and testing plan.
```

Сохрани результат в `spec.md`.

### Этап 2: Plan → prompt_plan.md

Используй reasoning-модель (o3/Claude) с промптом:
```
Draft a step-by-step blueprint for building this project.
Break into small iterative steps that build on each other.
Provide prompts for a code-generation LLM with TDD approach.
No hanging code — every step integrates into previous.

<SPEC>
[содержимое spec.md]
</SPEC>
```

Сохрани как `prompt_plan.md`, список задач в `todo.md`.

### Этап 3: Execute → Agent Mode

Выполняй промпты из `prompt_plan.md` по одному в Copilot Agent Mode.
После каждого: `npx vitest run` + ручная проверка.

---

## MCP Серверы

При открытии VS Code автоматически стартуют:

| Сервер | Что делает | Требует |
|--------|-----------|---------|
| `project-context` | Читает spec-файлы для агента | `npm run mcp:build` |
| `filesystem` | Расширенный доступ к файлам | npx |
| `git` | Git операции | uv (`pip install uv`) |
| `github` | GitHub API | GITHUB_TOKEN (вводится при запросе) |
| `postgres` | Прямые SQL запросы к БД | DATABASE_URL (вводится при запросе) |
| `memory` | Персистентная память | npx |

---

## Скрипты

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript без emit
npm run lint         # ESLint
npm run format       # Prettier
npx vitest run       # Тесты
npm run db:push      # Применить Prisma schema
npm run db:generate  # Сгенерировать Prisma client
npm run mcp:build    # Собрать custom MCP server
```

---

## Добавление RTL тестов (опционально)

По умолчанию vitest настроен для node-среды (unit тесты сервисов).
Для компонентных тестов с jsdom:

1. `npm install --save-dev @testing-library/react jsdom`
2. В `vitest.config.ts` → `environment: "jsdom"`
3. Или использовать `@vitest/environment-jsdom` per-file: `// @vitest-environment jsdom`
