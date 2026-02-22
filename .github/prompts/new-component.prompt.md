---
name: new-component
description: Create a new React component with TypeScript, tests, and barrel export
tools:
  - editFiles
  - codebase
---

# New React Component

Создай компонент **`${input:componentName}`** в папке **`${input:folderPath}`**.

## Что создать

1. `${input:folderPath}/${input:componentName}.tsx` — компонент
2. `${input:folderPath}/${input:componentName}.test.tsx` — тесты (если нужен DOM) или `*.test.ts`
3. `${input:folderPath}/index.ts` — barrel export

## Требования к компоненту

- TypeScript strict: явный `interface ${input:componentName}Props`
- Именованный export: `export function ${input:componentName}(...)`
- TailwindCSS для стилизации — без inline styles, без CSS modules
- `"use client"` — только если нужны: useState, useEffect, event handlers
- JSDoc комментарий к компоненту и нетривиальным props

## Требования к тестам

- Describe: `"${input:componentName}"`
- Покрыть: рендеринг по умолчанию + ключевые interactive сценарии
- Использовать `@testing-library/react` если DOM-тесты

## Barrel export

```ts
// index.ts
export { ${input:componentName} } from "./${input:componentName}";
export type { ${input:componentName}Props } from "./${input:componentName}";
```

Перед созданием — проверь `#codebase` нет ли уже похожего компонента.
