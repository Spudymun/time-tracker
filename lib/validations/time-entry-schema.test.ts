import { describe, it, expect } from "vitest";
import { CreateEntrySchema, UpdateEntrySchema, StopEntrySchema } from "./time-entry-schema";

describe("CreateEntrySchema", () => {
  it("accepts valid full input", () => {
    const result = CreateEntrySchema.safeParse({
      description: "Implement feature",
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      tagIds: ["123e4567-e89b-12d3-a456-426614174001"],
      billable: true,
      startedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional / have defaults)", () => {
    const result = CreateEntrySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.billable).toBe(false);
    }
  });

  it("accepts null description", () => {
    const result = CreateEntrySchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than 255 characters", () => {
    const result = CreateEntrySchema.safeParse({ description: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from description", () => {
    const result = CreateEntrySchema.safeParse({ description: "  task  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("task");
    }
  });

  it("rejects invalid projectId (not UUID)", () => {
    const result = CreateEntrySchema.safeParse({ projectId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts null projectId", () => {
    const result = CreateEntrySchema.safeParse({ projectId: null });
    expect(result.success).toBe(true);
  });

  it("rejects tagIds array with more than 10 items", () => {
    const tagIds = Array.from(
      { length: 11 },
      (_, i) => `123e4567-e89b-12d3-a456-4266141740${String(i).padStart(2, "0")}`
    );
    const result = CreateEntrySchema.safeParse({ tagIds });
    expect(result.success).toBe(false);
  });

  it("accepts empty tagIds array", () => {
    const result = CreateEntrySchema.safeParse({ tagIds: [] });
    expect(result.success).toBe(true);
  });

  it("rejects tagIds with invalid UUID", () => {
    const result = CreateEntrySchema.safeParse({ tagIds: ["not-a-uuid"] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid startedAt (not ISO datetime)", () => {
    const result = CreateEntrySchema.safeParse({ startedAt: "2024-01-01" });
    expect(result.success).toBe(false);
  });

  it("accepts startedAt as ISO datetime string", () => {
    const result = CreateEntrySchema.safeParse({
      startedAt: "2024-01-15T10:30:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateEntrySchema", () => {
  it("accepts empty object", () => {
    const result = UpdateEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all fields", () => {
    const result = UpdateEntrySchema.safeParse({
      description: "Updated",
      projectId: null,
      tagIds: [],
      billable: false,
      durationMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it("rejects durationMinutes = 0 (must be positive)", () => {
    const result = UpdateEntrySchema.safeParse({ durationMinutes: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects durationMinutes < 0", () => {
    const result = UpdateEntrySchema.safeParse({ durationMinutes: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects durationMinutes > 5999", () => {
    const result = UpdateEntrySchema.safeParse({ durationMinutes: 6000 });
    expect(result.success).toBe(false);
  });

  it("accepts durationMinutes = 1 (minimum)", () => {
    const result = UpdateEntrySchema.safeParse({ durationMinutes: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts durationMinutes = 5999 (maximum)", () => {
    const result = UpdateEntrySchema.safeParse({ durationMinutes: 5999 });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 tagIds", () => {
    const tagIds = Array.from(
      { length: 11 },
      (_, i) => `123e4567-e89b-12d3-a456-4266141740${String(i).padStart(2, "0")}`
    );
    const result = UpdateEntrySchema.safeParse({ tagIds });
    expect(result.success).toBe(false);
  });
});

describe("StopEntrySchema", () => {
  it("accepts empty object (stoppedAt is optional)", () => {
    const result = StopEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid ISO datetime for stoppedAt", () => {
    const result = StopEntrySchema.safeParse({
      stoppedAt: "2024-01-15T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid datetime format", () => {
    const result = StopEntrySchema.safeParse({ stoppedAt: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
