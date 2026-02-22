import { z } from "zod";

/**
 * Схема валидации для регистрации нового пользователя.
 *
 * password ограничен 72 символами — это лимит bcrypt (байты, не символы,
 * но для ASCII это практически одно и то же).
 */
export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or less"),
});

/**
 * Схема валидации для входа.
 * password.min(1) — только проверка на непустоту; реальная проверка — bcrypt в authorize().
 */
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
