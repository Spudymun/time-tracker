import { z } from "zod";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less").trim(),
  color: z
    .string()
    .regex(colorRegex, "Color must be a valid hex color (#RRGGBB)")
    .default("#6366f1"),
  estimatedHours: z.number().positive("Estimated hours must be greater than 0").optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater").optional(),
});

export const UpdateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less")
    .trim()
    .optional(),
  color: z.string().regex(colorRegex, "Color must be a valid hex color (#RRGGBB)").optional(),
  estimatedHours: z
    .number()
    .positive("Estimated hours must be greater than 0")
    .nullable()
    .optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater").nullable().optional(),
  isArchived: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
