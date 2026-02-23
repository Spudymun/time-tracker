# Feature: Dashboard

> Создан: 2026-02-22
> Статус: Ready
> Inspired by: Toggl weekly summary view

## Обзор

**Актор:** Пользователь
**Цель:** Быстро оценить рабочую активность за текущую неделю: сколько часов в день, по каким проектам
**MVP приоритет:** Must Have (усложняющий элемент относительно базового ТЗ)

## Пользовательские сценарии

### Happy Path

1. Пользователь открывает главную страницу `/`
2. В верхней части (под хедером с таймером, над списком записей) видит Dashboard widget
3. Widget содержит:
   - **Текущая неделя**: «Week of Feb 16–22»
   - **Bar chart**: 7 столбцов (Пн–Вс), высота = часы в этот день, каждый столбец разбит по проектам (stacked)
   - **Суммарно за неделю**: `23h 45m` (total), из них `18h 30m billable`
   - **Top projects** список: проект + цвет + время за неделю (до 5 проектов)
4. Кнопки «‹» «›» для навигации по неделям
5. Стрелка «→ View full report» ведёт на `/reports` с этим же периодом

### Compact mode

- При прокрутке страницы вниз dashboard сворачивается в compact bar (только total time текущей недели)

### Недельная цель (Weekly Target)

1. В настройках (Settings или прямо в Dashboard) пользователь задаёт цель, например: 40 часов
2. Над бар chart появляется зелёная полоса: «23h 45m / 40h (59%)»
3. При превышении цели полоса становится синей (переработка)
4. Без цели — полоса не отображается

### Earnings summary

1. Если хотя бы один проект в неделе имеет `hourlyRate`:
   - В блоке суммы появляется дополнительная строка: «Карнировано: $1 840»
   - Вычисляется только по billable-записям со ставкой

## Бизнес-правила

- Dashboard использует тот же API что и Reports: `GET /api/dashboard?from=&to=`
- Данные: только completed entries
- Неделя начинается с понедельника (ISO week)
- Bar chart: stacked по проектам, цвета из Project.color; «No project» = серый `#94a3b8`
- Максимум 7 проектов в stacked bar (остальные = «Other»)
- Top projects: топ-5 по totalSeconds за выбранную неделю
- Активная запись не включается
- `weeklyTargetHours` — опциональная настройка, хранится в `localStorage` (без сервера, так как single-tenant)
- Earnings summary показывается только если хотя бы один проект недели имеет `hourlyRate`

## Edge Cases

- Неделя без записей: показывать bar chart с 7 пустыми барами (totalSeconds=0), под chart — плейсхолдер «No entries this week. Start tracking to see your stats.» TopProjectsList скрыт
- `weeklyTargetHours` в localStorage не найден (очищен) → обрабатывать как `null` (нет цели), `WeeklyTargetBar` скрыт
- Навигация на будущую неделю: стрелка «›» заблокирована, нельзя навигировать вперёд текущей недели
- SSR / localStorage: `WeeklyTargetBar` использует `"use client"` и читает localStorage только после монтирования (useEffect), чтобы избежать hydration mismatch

## API

| Метод | Endpoint                 | Описание            |
| ----- | ------------------------ | ------------------- |
| GET   | /api/dashboard?from=&to= | Данные для дашборда |

### Response Schema

```typescript
{
  from: string; // ISO date (понедельник)
  to: string; // ISO date (воскресенье)
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null; // сумма заработка по проектам со ставкой
  byDay: Array<{
    date: string; // ISO date
    dayLabel: string; // «Mon», «Tue»...
    totalSeconds: number;
    byProject: Array<{
      projectId: string | null;
      projectName: string | null;
      color: string;
      seconds: number;
    }>;
  }>;
  topProjects: Array<{
    projectId: string | null;
    projectName: string | null;
    color: string;
    totalSeconds: number;
    billableSeconds: number;
    earnings: number | null;
  }>;
}
```

## Компоненты

```
components/dashboard/
  DashboardWidget.tsx       — контейнер, навигация по неделям
  WeeklyBarChart.tsx        — stacked bar chart (Recharts BarChart)
  WeeklySummary.tsx         — total/billable + earnings суммарно
  WeeklyTargetBar.tsx       — полоса прогресса к цели (зелёный/синий)
  TopProjectsList.tsx       — список топ-5 проектов с прогресс-баром + earnings
  DashboardCompact.tsx      — свёрнутый вид при скролле
```

## Зависимости

- **Recharts** — библиотека графиков (`npm install recharts`)
- `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` из recharts
