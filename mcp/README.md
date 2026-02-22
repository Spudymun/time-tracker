# Custom MCP Server: project-context

Кастомный MCP сервер, который предоставляет AI агенту доступ к spec-документам проекта через structured tools.

## Зачем это нужно

VS Code Agent Mode может вызывать MCP tools автоматически. Вместо того чтобы каждый раз вручную добавлять `#file:spec/FEATURE_x.md` в чат, агент сам вызывает `read_feature("timer")` и получает нужный контекст.

## Доступные tools

| Tool                 | Аргументы      | Что возвращает                      |
| -------------------- | -------------- | ----------------------------------- |
| `read_spec`          | —              | Содержимое `spec.md`                |
| `read_feature`       | `name: string` | Содержимое `spec/FEATURE_{name}.md` |
| `list_features`      | —              | Список всех FEATURE\_\*.md файлов   |
| `get_domain`         | —              | Содержимое `spec/DOMAIN.md`         |
| `get_business_rules` | —              | Содержимое `spec/BUSINESS_RULES.md` |
| `get_architecture`   | —              | Содержимое `spec/ARCHITECTURE.md`   |
| `get_vision`         | —              | Содержимое `spec/VISION.md`         |

## Первый запуск

```bash
# 1. Установить зависимости
cd mcp && npm install

# 2. Собрать TypeScript → JavaScript
npm run build     # создаёт mcp/dist/server.js

# 3. Проверить вручную (опционально)
npm run dev
```

После сборки VS Code автоматически запустит сервер при следующем открытии проекта (через `.vscode/mcp.json` + `chat.mcp.autoStart`).

## Как добавить новый tool

1. Добавь описание в `ListToolsRequestSchema` handler:

```ts
{
  name: "my_tool",
  description: "Clear description for the AI agent",
  inputSchema: {
    type: "object",
    properties: { param: { type: "string", description: "..." } },
    required: ["param"],
  },
}
```

2. Добавь case в `CallToolRequestSchema` handler:

```ts
case "my_tool": {
  const { param } = args as { param: string };
  // логика
  return { content: [{ type: "text", text: result }] };
}
```

## Важные правила

- **Никогда не пиши в stdout** — только в stderr для логов. stdout резервирован для JSON-RPC протокола.
- `WORKSPACE_ROOT` передаётся через env в `.vscode/mcp.json`, не хардкодить пути.
- Все файловые ошибки → graceful (возвращай сообщение об ошибке, не бросай exception).
