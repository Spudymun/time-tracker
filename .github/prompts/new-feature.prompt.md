---
name: new-feature
description: Scaffold a new feature following the spec-driven workflow
tools:
  - editFiles
  - codebase
  - search
---

# Scaffold New Feature

Реализуй фичу **`${input:featureName}`** по spec-driven workflow.

## Шаг 1: Загрузи контекст

1. Прочитай `spec/FEATURE_${input:featureName}.md` — требования и edge cases
2. Прочитай `spec/DOMAIN.md` — определения сущностей
3. Прочитай `spec/BUSINESS_RULES.md` — глобальные ограничения

Если `spec/FEATURE_${input:featureName}.md` не существует — **остановись** и скажи:

> "Прежде чем реализовывать, создай `spec/FEATURE_${input:featureName}.md` с описанием фичи."

## Шаг 2: Изучи существующий код

Перед созданием нового — проверь в `#codebase`:

- Существующие репозитории в `lib/db/`
- Существующие схемы в `lib/validations/`
- Паттерны роутов в `app/api/`
- Похожие компоненты в `components/`

## Шаг 3: Реализуй в правильном порядке

1. **Zod-схема** → `lib/validations/${input:featureName}-schema.ts`
2. **Репозиторий** → `lib/db/${input:featureName}-repository.ts`
3. **API routes** → `app/api/${input:featureName}/route.ts`
4. **Сервис** (если есть бизнес-логика) → `lib/services/${input:featureName}-service.ts`
5. **Компоненты** → `components/${input:featureName}/`
6. **Тесты** → рядом с каждым сервисом/схемой

## Шаг 4: Интеграция

- Подключи компоненты к существующим страницам
- Убедись что роуты доступны
- Проверь что Prisma-схема включает нужные модели

## По завершении скажи

"Фича `${input:featureName}` реализована. Проверь вручную:

- [конкретный сценарий 1]
- [конкретный сценарий 2]"
