---
name: spec-review
description: Compare current implementation against spec, find gaps and scope creep
tools:
  - codebase
  - search
---

# Review Implementation vs Spec

Сравни текущую реализацию с спецификацией.

## Прочитай spec

1. `spec/VISION.md` — MVP границы
2. `spec/DOMAIN.md` — сущности
3. `spec/BUSINESS_RULES.md` — правила
4. Все `spec/FEATURE_*.md` — фичи

## Проверь реализацию

Используй `#codebase` для поиска реализации каждой фичи из spec.

## Формат отчёта

### Реализованные фичи

✅ [Требование из spec] → [Где реализовано]

### Нереализованные требования

❌ [Требование из spec] → Не реализовано

### Scope creep (код без spec)

⚠️ [Что реализовано] → Отсутствует в spec

### Бизнес-правила

✅/❌ [Правило] → [Где применяется / Отсутствует]

### Итог

Готовность к MVP: X%
Критические пробелы: [список]
Рекомендуемые следующие шаги: [список]
