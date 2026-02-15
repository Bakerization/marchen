import type { Role, SessionUser } from "@/types/auth";

/**
 * Check if a user has one of the allowed roles.
 * Used server-side to guard actions and API routes.
 */
export const hasRole = (user: SessionUser, allowed: Role[]): boolean => {
  return allowed.includes(user.role);
};

/**
 * Assert that a user has one of the allowed roles.
 * Throws if unauthorized — use in Server Actions and API routes.
 */
export const requireRole = (user: SessionUser, allowed: Role[]): void => {
  if (!hasRole(user, allowed)) {
    throw new Error(`Forbidden: requires one of [${allowed.join(", ")}]`);
  }
};

/** Convenience: only ADMIN */
export const requireAdmin = (user: SessionUser) =>
  requireRole(user, ["ADMIN"]);

/** Convenience: ADMIN or ORGANIZER */
export const requireOrganizer = (user: SessionUser) =>
  requireRole(user, ["ADMIN", "ORGANIZER"]);

/** Convenience: ADMIN or VENDOR */
export const requireVendor = (user: SessionUser) =>
  requireRole(user, ["ADMIN", "VENDOR"]);
