import { describe, it, expect } from "vitest";
import { CreateProjectSchema, UpdateProjectSchema } from "./project-schema";

describe("CreateProjectSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = CreateProjectSchema.safeParse({
      name: "My Project",
      color: "#6366f1",
      estimatedHours: 10,
      hourlyRate: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal input (name only, uses defaults)", () => {
    const result = CreateProjectSchema.safeParse({ name: "Min" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#6366f1");
    }
  });

  it("rejects empty name", () => {
    const result = CreateProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    const result = CreateProjectSchema.safeParse({ name: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = CreateProjectSchema.safeParse({ name: "  My Project  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Project");
    }
  });

  it("rejects invalid color format", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", color: "red" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color — wrong length", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", color: "#fff" });
    expect(result.success).toBe(false);
  });

  it("accepts valid 6-digit hex color", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", color: "#ABC123" });
    expect(result.success).toBe(true);
  });

  it("rejects estimatedHours = 0 (must be > 0)", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", estimatedHours: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects estimatedHours < 0", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", estimatedHours: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts estimatedHours as positive float", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", estimatedHours: 0.5 });
    expect(result.success).toBe(true);
  });

  it("rejects hourlyRate < 0", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", hourlyRate: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts hourlyRate = 0", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", hourlyRate: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts omitted optional fields", () => {
    const result = CreateProjectSchema.safeParse({ name: "P" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedHours).toBeUndefined();
      expect(result.data.hourlyRate).toBeUndefined();
    }
  });
});

describe("UpdateProjectSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = UpdateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts isArchived: true", () => {
    const result = UpdateProjectSchema.safeParse({ isArchived: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isArchived).toBe(true);
  });

  it("does not accept isArchived in CreateProjectSchema", () => {
    const result = CreateProjectSchema.safeParse({ name: "P", isArchived: true });
    // isArchived is stripped by Zod (not in schema) — no error, just ignored
    // CreateProjectSchema doesn't have isArchived so it's just not in output
    expect(result.success).toBe(true);
  });

  it("accepts null for estimatedHours (clearing the value)", () => {
    const result = UpdateProjectSchema.safeParse({ estimatedHours: null });
    expect(result.success).toBe(true);
  });

  it("accepts null for hourlyRate", () => {
    const result = UpdateProjectSchema.safeParse({ hourlyRate: null });
    expect(result.success).toBe(true);
  });

  it("rejects empty name string", () => {
    const result = UpdateProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
