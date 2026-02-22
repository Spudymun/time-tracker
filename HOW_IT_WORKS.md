# Как работает vibe-coder-template — Визуальный гайд

## Что это такое?

**Стартовый шаблон** для разработки с GitHub Copilot.
Смысл: агент не гадает что делать — у него есть готовые инструкции, спецификации и правила.
Ты пишешь spec → агент пишет код.

---

## Общая архитектура системы

```mermaid
graph TB
    subgraph YOU["👤 ТЫ (разработчик)"]
        IDEA[💡 Идея проекта]
        SPEC_WRITE[Пишешь спецификацию]
        APPROVE[Одобряешь план]
        VERIFY[Проверяешь результат]
    end

    subgraph SPEC_LAYER["📄 SPEC LAYER — Контракт"]
        VISION[spec/VISION.md\nЧто и зачем]
        DOMAIN[spec/DOMAIN.md\nСущности и связи]
        RULES[spec/BUSINESS_RULES.md\nБизнес-правила]
        FEATURE[spec/FEATURE_name.md\nПо каждой фиче]
        SPECMD[spec.md\nОбщие требования]
    end

    subgraph AI_LAYER["🤖 AI LAYER — Инструкции для агента"]
        COPILOT_INS[.github/copilot-instructions.md\nТехстек + конвенции]
        INSTRUCTIONS[.github/instructions/*.md\nПравила по слоям кода]
        AGENTS[.github/agents/\nplanner + reviewer]
        PROMPTS[.github/prompts/\n/new-feature, /spec-review]
        SKILLS[.github/skills/\nspec-driven, db-operations]
    end

    subgraph MCP_LAYER["⚡ MCP LAYER — Инструменты агента"]
        MCP_PROJECT[project-context\nЧитает spec-файлы]
        MCP_FS[filesystem\nДоступ к файлам]
        MCP_PG[postgres\nSQL к БД]
        MCP_GIT[git/github\nGit операции]
    end

    subgraph CODE["💻 КОД"]
        PRISMA[prisma/schema.prisma]
        REPO[lib/db/*-repository.ts]
        VALID[lib/validations/*-schema.ts]
        SERVICES[lib/services/*.ts]
        API[app/api/**/route.ts]
        UI[components/**]
        STORE[lib/stores/*.ts]
    end

    IDEA --> SPEC_WRITE
    SPEC_WRITE --> SPEC_LAYER
    SPEC_LAYER --> AI_LAYER
    AI_LAYER --> APPROVE
    APPROVE --> MCP_LAYER
    MCP_LAYER --> CODE
    CODE --> VERIFY
```

---

## Рабочий процесс: от идеи до кода (Harper Reed Workflow)

```mermaid
flowchart LR
    subgraph PHASE1["📝 Этап 1: Spec"]
        A1[ChatGPT/Claude\nBrainstorm сессия] --> A2[spec.md\nОбщая спецификация]
        A2 --> A3[spec/VISION.md\nspec/DOMAIN.md\nspec/BUSINESS_RULES.md]
        A3 --> A4[spec/FEATURE_name.md\nдля каждой фичи]
    end

    subgraph PHASE2["🗺️ Этап 2: Plan"]
        B1[o3/Claude reasoning\nс промптом планирования] --> B2[prompt_plan.md\nПошаговые промпты]
        B2 --> B3[todo.md\nСписок задач]
    end

    subgraph PHASE3["⚡ Этап 3: Execute"]
        C1[Copilot Agent Mode\n@planner → план] --> C2[Выполняй промпты\nпо одному]
        C2 --> C3[npx vitest run\n+ ручная проверка]
        C3 -->|следующий промпт| C2
    end

    PHASE1 --> PHASE2
    PHASE2 --> PHASE3
```

### Этап 1: Brainstorm → `spec.md`

Используй ChatGPT/Claude с промптом:
```
Ask me one question at a time so we can develop a thorough, step-by-step spec
for this idea. Our end goal is a detailed specification I can hand off.
Only one question at a time.

Here's the idea: [ОПИСАНИЕ ИДЕИ]
```

После сессии попроси:
```
Now compile our findings into a developer-ready specification with all
requirements, architecture choices, error handling, and testing plan.
```

Сохрани результат в `spec.md` и разбей по файлам `spec/*.md`.

### Этап 2: Plan → `prompt_plan.md`

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

Сохрани как `prompt_plan.md`, список задач — в `todo.md`.

### Этап 3: Execute → Agent Mode

Выполняй промпты из `prompt_plan.md` по одному в Copilot Agent Mode.
После каждого: `npx vitest run` + ручная проверка + отмечай в `todo.md`.

---

## Порядок создания файлов при реализации фичи

```mermaid
flowchart TD
    S[spec/FEATURE_name.md] --> P

    P[prisma/schema.prisma\n🗄️ модель данных в БД]
    P --> V[lib/validations/\n📋 Zod schema\nвалидация входных данных]
    V --> R[lib/db/*-repository.ts\n🔌 Prisma запросы к БД]
    R --> SVC[lib/services/*.ts\n⚙️ Бизнес-логика\npure functions]
    SVC --> API[app/api/**/route.ts\n🌐 HTTP endpoints\nGET, POST, PUT, DELETE]
    API --> STORE[lib/stores/*.ts\n🧠 Zustand store\nклиентский стейт]
    STORE --> UI[components/**\n🖼️ React компоненты\nUI + интерактивность]

    V -.->|unit tests| TEST[lib/validations/*.test.ts\nlib/services/*.test.ts\n✅ Vitest]
    SVC -.->|unit tests| TEST
```

**Важно:** всегда строго соблюдать этот порядок — каждый слой зависит от предыдущего.

---

## Назначение файлов в `.github/`

| Файл/папка | Что делает | Когда применяется |
|---|---|---|
| `copilot-instructions.md` | Техстек, структура папок, code guidelines | **Всегда** — загружается автоматически |
| `instructions/ai-agent-rules.md` | Правила поведения агента (язык, фокус, запреты) | Применяется к `**` |
| `instructions/typescript.md` | TS strict, без `any`, функциональные компоненты | Применяется к `**/*.ts,tsx` |
| `instructions/api-routes.md` | Zod перед БД, правильные HTTP коды | Применяется к `app/api/**` |
| `instructions/prisma.md` | Только через репозитории, singleton клиент | Применяется к `lib/db/**` |
| `instructions/tests.md` | Vitest паттерны, что и как тестировать | Применяется к `**.test.ts` |
| `agents/planner.agent.md` | `@planner` — только планирует, не пишет код | Ручной вызов `@planner` |
| `agents/reviewer.agent.md` | Code review на соответствие spec | Ручной вызов |
| `prompts/new-feature.prompt.md` | `/new-feature name` — реализовать фичу | Slash command |
| `prompts/spec-review.prompt.md` | `/spec-review` — сравнить код со spec | Slash command |
| `prompts/new-component.prompt.md` | `/new-component name` — создать компонент | Slash command |
| `skills/spec-driven/SKILL.md` | Детальный workflow реализации фичи | Автоматически при "реализуй/добавь" |
| `skills/db-operations/SKILL.md` | Паттерны репозиториев и Prisma | Автоматически при работе с БД |

---

## Три слоя системы

| Слой | Что это | Кто это использует |
|------|---------|-------------------|
| **`spec/`** | Контракт: что нужно построить | Ты пишешь, агент читает |
| **`.github/`** | Инструкции для агента | Copilot читает автоматически |
| **`mcp/`** | Инструменты агента (сервер) | Copilot вызывает через VS Code |

---

## Как начать новый проект

```bash
# 1. Скопируй шаблон
cp -r E:\project\vibe-coder-template E:\project\my-project
cd E:\project\my-project

# 2. Установи зависимости
npm install

# 3. Настрой .env.local
cp .env.example .env.local
# → DATABASE_URL=postgresql://...

# 4. Собери MCP сервер
npm run mcp:build

# 5. Перезапусти VS Code — MCP стартует автоматически
```

Затем:
1. Заполни `spec/VISION.md`, `spec/DOMAIN.md`, `spec/BUSINESS_RULES.md`
2. Создай `spec/FEATURE_name.md` для каждой фичи (из шаблона `FEATURE_template.md`)
3. Замени `[PROJECT_NAME]` в `.github/copilot-instructions.md`
4. Заполни `spec.md` через brainstorm-сессию
5. Сгенерируй `prompt_plan.md` через reasoning-модель
6. Открой Copilot Agent Mode → выполняй промпты по одному

---

## Ключевые команды в чате Copilot (Agent Mode)

```
@planner реализуй фичу X     → составит план без кода, потом передаст агенту
/new-feature auth             → реализует фичу auth по spec
/spec-review                  → проверит соответствие текущего кода spec
/new-component UserCard       → создаст React компонент
```

---

## Главный принцип

> **Нет spec → нет кода.**
>
> Агент обязан прочитать `spec/FEATURE_name.md` перед любой реализацией.
> Если файла нет — он скажет тебе создать его сначала.
> Это предотвращает ситуацию когда агент гадает и делает не то что нужно.
