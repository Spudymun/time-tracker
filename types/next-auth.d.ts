import type { DefaultSession } from "next-auth";

/**
 * Расширение типов Auth.js сессии и JWT.
 *
 * ПОЧЕМУ: Auth.js по умолчанию не включает userId в session.user.
 * Без этого файла TypeScript ругается на session.user.id во всех API routes.
 * Добавляем id в оба типа: Session и JWT.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
