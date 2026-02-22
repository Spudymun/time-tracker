import { z } from "zod";

export const CreateEntrySchema = z.object({
  description: z
    .string()
    .max(255, "Description must be 255 characters or less")
    .trim()
    .nullable()
    .optional(),
  projectId: z.string().uuid("Invalid project ID").nullable().optional(),
  tagIds: z.array(z.string().uuid("Invalid tag ID")).max(10, "Maximum 10 tags").optional(),
  billable: z.boolean().optional().default(false),
  startedAt: z.string().datetime("Invalid datetime format").optional(),
});

export const UpdateEntrySchema = z.object({
  description: z
    .string()
    .max(255, "Description must be 255 characters or less")
    .trim()
    .nullable()
    .optional(),
  projectId: z.string().uuid("Invalid project ID").nullable().optional(),
  tagIds: z.array(z.string().uuid("Invalid tag ID")).max(10, "Maximum 10 tags").optional(),
  billable: z.boolean().optional(),
  /**
   * Длительность в минутах — если задана, stoppedAt = startedAt + durationMinutes * 60s.
   * Допустимый диапазон: 1 минута – 5999 минут (≈ 100 ч).
   */
  durationMinutes: z
    .number()
    .positive("Duration must be greater than 0")
    .max(5999, "Duration cannot exceed 5999 minutes")
    .optional(),
});

export const StopEntrySchema = z.object({
  stoppedAt: z.string().datetime("Invalid datetime format").optional(),
});

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;
export type StopEntryInput = z.infer<typeof StopEntrySchema>;
