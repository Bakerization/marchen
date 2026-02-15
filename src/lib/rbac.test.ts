import { describe, it, expect } from "vitest";
import { hasRole, requireRole, requireAdmin, requireOrganizer, requireVendor } from "./rbac";
import type { SessionUser } from "@/types/auth";

const makeUser = (role: SessionUser["role"]): SessionUser => ({
  id: "test-id",
  email: "test@example.com",
  name: "Test User",
  role,
});

describe("hasRole", () => {
  it("returns true when user role is in allowed list", () => {
    expect(hasRole(makeUser("ADMIN"), ["ADMIN", "ORGANIZER"])).toBe(true);
    expect(hasRole(makeUser("ORGANIZER"), ["ADMIN", "ORGANIZER"])).toBe(true);
  });

  it("returns false when user role is not in allowed list", () => {
    expect(hasRole(makeUser("VENDOR"), ["ADMIN", "ORGANIZER"])).toBe(false);
  });
});

describe("requireRole", () => {
  it("does not throw when user has allowed role", () => {
    expect(() => requireRole(makeUser("ADMIN"), ["ADMIN"])).not.toThrow();
  });

  it("throws when user lacks required role", () => {
    expect(() => requireRole(makeUser("VENDOR"), ["ADMIN"])).toThrow(
      "Forbidden: requires one of [ADMIN]",
    );
  });
});

describe("requireAdmin", () => {
  it("allows ADMIN", () => {
    expect(() => requireAdmin(makeUser("ADMIN"))).not.toThrow();
  });

  it("rejects ORGANIZER", () => {
    expect(() => requireAdmin(makeUser("ORGANIZER"))).toThrow("Forbidden");
  });

  it("rejects VENDOR", () => {
    expect(() => requireAdmin(makeUser("VENDOR"))).toThrow("Forbidden");
  });
});

describe("requireOrganizer", () => {
  it("allows ADMIN", () => {
    expect(() => requireOrganizer(makeUser("ADMIN"))).not.toThrow();
  });

  it("allows ORGANIZER", () => {
    expect(() => requireOrganizer(makeUser("ORGANIZER"))).not.toThrow();
  });

  it("rejects VENDOR", () => {
    expect(() => requireOrganizer(makeUser("VENDOR"))).toThrow("Forbidden");
  });
});

describe("requireVendor", () => {
  it("allows ADMIN", () => {
    expect(() => requireVendor(makeUser("ADMIN"))).not.toThrow();
  });

  it("allows VENDOR", () => {
    expect(() => requireVendor(makeUser("VENDOR"))).not.toThrow();
  });

  it("rejects ORGANIZER", () => {
    expect(() => requireVendor(makeUser("ORGANIZER"))).toThrow("Forbidden");
  });
});
