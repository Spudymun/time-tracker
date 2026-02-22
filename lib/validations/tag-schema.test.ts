import { describe, it, expect } from "vitest";
import { CreateTagSchema, UpdateTagSchema } from "./tag-schema";

describe("CreateTagSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = CreateTagSchema.safeParse({
      name: "meeting",
      color: "#10b981",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal input (name only, uses default color)", () => {
    const result = CreateTagSchema.safeParse({ name: "dev" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#10b981");
    }
  });

  it("rejects empty name", () => {
    const result = CreateTagSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 30 characters", () => {
    const result = CreateTagSchema.safeParse({ name: "A".repeat(31) });
    expect(result.success).toBe(false);
  });

  it("converts name to lowercase", () => {
    const result = CreateTagSchema.safeParse({ name: "Meeting" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("meeting");
    }
  });

  it("trims whitespace from name", () => {
    const result = CreateTagSchema.safeParse({ name: "  dev  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("dev");
    }
  });

  it("rejects invalid color format", () => {
    const result = CreateTagSchema.safeParse({ name: "tag", color: "green" });
    expect(result.success).toBe(false);
  });

  it("accepts valid hex color", () => {
    const result = CreateTagSchema.safeParse({ name: "tag", color: "#FF5733" });
    expect(result.success).toBe(true);
  });

  it("accepts hex color with lowercase letters", () => {
    const result = CreateTagSchema.safeParse({ name: "tag", color: "#ff5733" });
    expect(result.success).toBe(true);
  });

  it("rejects 3-digit short hex", () => {
    const result = CreateTagSchema.safeParse({ name: "tag", color: "#fff" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateTagSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = UpdateTagSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with name only", () => {
    const result = UpdateTagSchema.safeParse({ name: "design" });
    expect(result.success).toBe(true);
  });

  it("converts name to lowercase in update", () => {
    const result = UpdateTagSchema.safeParse({ name: "DESIGN" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("design");
    }
  });

  it("accepts partial update with color only", () => {
    const result = UpdateTagSchema.safeParse({ color: "#ABC123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name in update", () => {
    const result = UpdateTagSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color in update", () => {
    const result = UpdateTagSchema.safeParse({ color: "blue" });
    expect(result.success).toBe(false);
  });
});
