/** @type {import("prettier").Config} */
const config = {
  // Base formatting
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  trailingComma: "es5",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",

  // JSX
  jsxSingleQuote: false,

  // End of line
  endOfLine: "lf",

  // Plugins
  plugins: ["prettier-plugin-tailwindcss"],

  // TailwindCSS plugin — авто-сортировка классов
  // Читает конфиг из tailwind.config.ts (если есть) или угадывает из CSS
  tailwindStylesheet: "./app/globals.css",
};

export default config;
