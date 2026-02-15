import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types/auth";

/**
 * Get the current session user, or null if not authenticated.
 * Use in Server Components and Server Actions.
 */
export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role,
  };
};

/**
 * Get the current session user or throw 401.
 * Use in Server Actions that require authentication.
 */
export const requireAuth = async (): Promise<SessionUser> => {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};
