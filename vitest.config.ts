import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Единая среда: jsdom для поддержки как unit так и React-тестов
    environment: "jsdom",

    // Глобальные импорты (describe, it, expect) без явного import
    globals: true,

    // Setup для @testing-library/react (cleanup after each test)
    setupFiles: ["./vitest.setup.ts"],

    // Позволяет указать environment per-file: @vitest-environment node
    environmentMatchGlobs: [
      // Тесты сервисов/схем — быстрый node environment
      ["lib/**/*.test.ts", "node"],
      ["lib/**/*.spec.ts", "node"],
    ],

    // Coverage (опционально)
    coverage: {
      provider: "v8",
      include: ["lib/**", "components/**"],
      exclude: ["lib/prisma.ts", "lib/auth.ts", "**/*.test.ts", "**/*.spec.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
