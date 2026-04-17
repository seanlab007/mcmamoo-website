/**
 * Tests for mao router procedures
 * Covers: submitApplication, listApplications, listSubscribers, updateApplicationStatus
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: role === "admin" ? 999 : 1,
    openId: `test-${role}`,
    email: `${role}@example.com`,
    name: role === "admin" ? "Admin User" : "Regular User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// Mock the database to avoid actual DB calls in tests
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock notification to avoid actual API calls
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("mao.listApplications", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createCtx("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.mao.listApplications()).rejects.toThrow("仅管理员可访问");
  });

  it("returns empty array when db is unavailable (admin)", async () => {
    const ctx = createCtx("admin");
    const caller = appRouter.createCaller(ctx);

    // db is mocked to return null, so should return []
    const result = await caller.mao.listApplications();
    expect(result).toEqual([]);
  });
});

describe("mao.listSubscribers", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createCtx("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.mao.listSubscribers()).rejects.toThrow("仅管理员可访问");
  });

  it("returns empty array when db is unavailable (admin)", async () => {
    const ctx = createCtx("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mao.listSubscribers();
    expect(result).toEqual([]);
  });
});

describe("mao.updateApplicationStatus", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createCtx("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mao.updateApplicationStatus({ id: 1, status: "approved" })
    ).rejects.toThrow("仅管理员可操作");
  });

  it("throws error when db is unavailable (admin)", async () => {
    const ctx = createCtx("admin");
    const caller = appRouter.createCaller(ctx);

    // db is null, so should throw "Database unavailable"
    await expect(
      caller.mao.updateApplicationStatus({ id: 1, status: "approved" })
    ).rejects.toThrow("Database unavailable");
  });
});

describe("mao.submitApplication", () => {
  it("throws error when db is unavailable", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mao.submitApplication({
        name: "Test User",
        organization: "Test Org",
        consultType: "military",
        description: "Test description",
      })
    ).rejects.toThrow("Database unavailable");
  });

  it("validates required fields", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);

    // Empty name should fail validation
    await expect(
      caller.mao.submitApplication({
        name: "",
        organization: "Test Org",
        consultType: "military",
      })
    ).rejects.toThrow();
  });
});

describe("mao.subscribeBrief", () => {
  it("throws error when db is unavailable", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mao.subscribeBrief({ email: "test@example.com" })
    ).rejects.toThrow("Database unavailable");
  });

  it("validates email format", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mao.subscribeBrief({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
