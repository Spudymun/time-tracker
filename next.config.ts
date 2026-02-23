import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ─── TypeScript ───────────────────────────────────────────────────────────
  typescript: {
    // Сборка не падает при TS-ошибках (CI проверяет отдельно через type-check)
    // Поставь false если хочешь жёсткую проверку при build
    ignoreBuildErrors: false,
  },

  // ─── ESLint ───────────────────────────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── Images ──────────────────────────────────────────────────────────────
  // Разрешаем домены OAuth провайдеров для аватаров пользователей
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/u/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
    ],
  },

  // ─── Server external packages ─────────────────────────────────────────────
  // bcryptjs и Prisma нужны только на сервере (API routes), не попадают в клиентский бандл.
  // @prisma/client и адаптер используют node:crypto/fs/path — webpack их не может бандлить.
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-pg"],

  // ─── Webpack ──────────────────────────────────────────────────────────────
  // Prisma v7 с custom output (generated/) использует node:* модули.
  // webpack не умеет резолвить node:-схему → заменяем на обычное имя модуля.
  webpack: (config, { webpack }) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:(.*)$/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
    return config;
  },
};

export default nextConfig;
