import { z } from "zod";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const CreateTagSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name must be 30 characters or less")
    .trim()
    .toLowerCase(),
  color: z
    .string()
    .regex(colorRegex, "Color must be a valid hex color (#RRGGBB)")
    .default("#10b981"),
});

export const UpdateTagSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name must be 30 characters or less")
    .trim()
    .toLowerCase()
    .optional(),
  color: z.string().regex(colorRegex, "Color must be a valid hex color (#RRGGBB)").optional(),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;
