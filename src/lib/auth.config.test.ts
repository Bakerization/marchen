import { describe, it, expect } from "vitest";
import { authConfig } from "./auth.config";

describe("auth.config callbacks", () => {
  describe("jwt callback", () => {
    const jwtCallback = authConfig.callbacks!.jwt! as (params: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
    }) => Record<string, unknown>;

    it("sets id and role on token when user is present (login)", () => {
      const token = { sub: "existing" };
      const user = { id: "user-123", role: "ORGANIZER" };

      const result = jwtCallback({ token, user });

      expect(result.id).toBe("user-123");
      expect(result.role).toBe("ORGANIZER");
    });

    it("preserves existing token data when no user (subsequent requests)", () => {
      const token = { sub: "existing", id: "user-123", role: "VENDOR" };

      const result = jwtCallback({ token });

      expect(result.id).toBe("user-123");
      expect(result.role).toBe("VENDOR");
    });
  });

  describe("session callback", () => {
    const sessionCallback = authConfig.callbacks!.session! as (params: {
      session: { user: Record<string, unknown> };
      token: Record<string, unknown>;
    }) => { user: Record<string, unknown> };

    it("copies id and role from token to session.user", () => {
      const session = { user: { email: "test@example.com" } };
      const token = { id: "user-456", role: "ADMIN" };

      const result = sessionCallback({ session, token });

      expect(result.user.id).toBe("user-456");
      expect(result.user.role).toBe("ADMIN");
    });
  });

  describe("authorized callback", () => {
    const authorizedCallback = authConfig.callbacks!.authorized! as (params: {
      auth: { user?: Record<string, unknown> } | null;
      request: { nextUrl: URL };
    }) => boolean | Response;

    it("allows access to public routes when not logged in", () => {
      const result = authorizedCallback({
        auth: null,
        request: { nextUrl: new URL("http://localhost:3000/events") },
      });
      expect(result).toBe(true);
    });

    it("redirects to /login when accessing /dashboard without auth", () => {
      const result = authorizedCallback({
        auth: null,
        request: { nextUrl: new URL("http://localhost:3000/dashboard") },
      });
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("location")).toContain("/login");
    });

    it("allows access to /dashboard when logged in", () => {
      const result = authorizedCallback({
        auth: { user: { id: "user-123", role: "VENDOR" } },
        request: { nextUrl: new URL("http://localhost:3000/dashboard") },
      });
      expect(result).toBe(true);
    });

    it("redirects to /login when accessing /manage route without auth", () => {
      const result = authorizedCallback({
        auth: null,
        request: {
          nextUrl: new URL("http://localhost:3000/events/123/manage"),
        },
      });
      expect(result).toBeInstanceOf(Response);
    });
  });
});
