import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

// WORKSPACE_ROOT передаётся через env из .vscode/mcp.json
// В dev-режиме (tsx server.ts из папки mcp/) — берём директорию выше
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? resolve(__dirname, "..");

/**
 * Читает файл из workspace. Возвращает null если файл не найден.
 * IMPORTANT: Никогда не пишем в stdout — это резервировано для JSON-RPC.
 * Логи идут только в stderr.
 */
function readWorkspaceFile(relativePath: string): string | null {
  const fullPath = join(WORKSPACE_ROOT, relativePath);
  if (!existsSync(fullPath)) {
    process.stderr.write(`[MCP] File not found: ${fullPath}\n`);
    return null;
  }
  try {
    return readFileSync(fullPath, "utf-8");
  } catch (err) {
    process.stderr.write(`[MCP] Failed to read ${fullPath}: ${err}\n`);
    return null;
  }
}

const server = new Server(
  { name: "project-context", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// ─── Список инструментов ──────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_spec",
      description:
        "Read the root spec.md — main project specification with requirements and scope",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "read_feature",
      description:
        "Read detailed specification for a specific feature from spec/FEATURE_{name}.md",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Feature name without prefix/extension (e.g., 'timer', 'projects', 'reports')",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "list_features",
      description:
        "List all available feature specifications in the spec/ directory",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_domain",
      description:
        "Read DOMAIN.md — entities, relations, field definitions, and constraints",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_business_rules",
      description:
        "Read BUSINESS_RULES.md — global rules and constraints that apply across all features",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_architecture",
      description:
        "Read ARCHITECTURE.md — architecture decisions, patterns, and folder structure rationale",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_vision",
      description:
        "Read VISION.md — MVP scope, target audience, and success metrics",
      inputSchema: { type: "object", properties: {}, required: [] },
    },    {
      name: "get_design_system",
      description:
        "Read DESIGN_SYSTEM.md \u2014 design tokens, component rules, forbidden Tailwind classes, typography and spacing guidelines",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_ui_states",
      description:
        "Read UI_STATES.md \u2014 empty states, loading skeletons, error states, 401 interceptor, accessibility rules",
      inputSchema: { type: "object", properties: {}, required: [] },
    },  ],
}));

// ─── Обработчики инструментов ─────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "read_spec": {
      const content = readWorkspaceFile("spec.md");
      return {
        content: [
          {
            type: "text" as const,
            text:
              content ??
              "spec.md not found. Create it with the project specification using the Harper Reed workflow.",
          },
        ],
      };
    }

    case "read_feature": {
      const featureName =
        args && typeof (args as Record<string, unknown>).name === "string"
          ? (args as { name: string }).name
          : null;

      if (!featureName) {
        return {
          content: [
            {
              type: "text" as const,
              text: 'Missing required argument: name. Example: { "name": "timer" }',
            },
          ],
        };
      }

      const content = readWorkspaceFile(`spec/FEATURE_${featureName}.md`);
      return {
        content: [
          {
            type: "text" as const,
            text:
              content ??
              `spec/FEATURE_${featureName}.md not found.\n\nCreate it before implementing this feature. Use spec/FEATURE_template.md as a starting point.`,
          },
        ],
      };
    }

    case "list_features": {
      const specDir = join(WORKSPACE_ROOT, "spec");
      if (!existsSync(specDir)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "spec/ directory not found. Create it with VISION.md, DOMAIN.md, ARCHITECTURE.md, BUSINESS_RULES.md, and FEATURE_*.md files.",
            },
          ],
        };
      }

      const features = readdirSync(specDir)
        .filter((f) => f.startsWith("FEATURE_") && f.endsWith(".md"))
        .filter((f) => f !== "FEATURE_template.md")
        .map((f) => f.replace(/^FEATURE_/, "").replace(/\.md$/, ""));

      return {
        content: [
          {
            type: "text" as const,
            text:
              features.length > 0
                ? `Available feature specs:\n${features.map((f) => `- ${f}  (spec/FEATURE_${f}.md)`).join("\n")}`
                : "No feature specs found in spec/. Create FEATURE_{name}.md files for each feature.",
          },
        ],
      };
    }

    case "get_domain": {
      const content = readWorkspaceFile("spec/DOMAIN.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/DOMAIN.md not found.",
          },
        ],
      };
    }

    case "get_business_rules": {
      const content = readWorkspaceFile("spec/BUSINESS_RULES.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/BUSINESS_RULES.md not found.",
          },
        ],
      };
    }

    case "get_architecture": {
      const content = readWorkspaceFile("spec/ARCHITECTURE.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/ARCHITECTURE.md not found.",
          },
        ],
      };
    }

    case "get_vision": {
      const content = readWorkspaceFile("spec/VISION.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/VISION.md not found.",
          },
        ],
      };
    }

    case "get_design_system": {
      const content = readWorkspaceFile("spec/DESIGN_SYSTEM.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/DESIGN_SYSTEM.md not found.",
          },
        ],
      };
    }

    case "get_ui_states": {
      const content = readWorkspaceFile("spec/UI_STATES.md");
      return {
        content: [
          {
            type: "text" as const,
            text: content ?? "spec/UI_STATES.md not found.",
          },
        ],
      };
    }

    default:
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}. Available tools: read_spec, read_feature, list_features, get_domain, get_business_rules, get_architecture, get_vision, get_design_system, get_ui_states`,
          },
        ],
      };
  }
});

// ─── Запуск ───────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[MCP] project-context server started. WORKSPACE_ROOT: ${WORKSPACE_ROOT}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`[MCP] Fatal error: ${error}\n`);
  process.exit(1);
});
