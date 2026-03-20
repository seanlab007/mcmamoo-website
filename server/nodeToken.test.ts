import { describe, it, expect } from "vitest";

describe("NODE_REGISTRATION_TOKEN", () => {
  it("should be set and have sufficient length", () => {
    const token = process.env.NODE_REGISTRATION_TOKEN;
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect((token as string).length).toBeGreaterThanOrEqual(8);
  });
});
