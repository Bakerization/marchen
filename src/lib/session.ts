import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get the current session user, or null if not authenticated.
 * Use in Server Components and Server Actions.
 */
export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.email) return null;

  // Resolve against DB so stale JWT IDs after DB resets do not break FK relations.
  const dbUserById = sessionUser.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, email: true, name: true, role: true },
      })
    : null;
  const dbUser =
    dbUserById ??
    (await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true, email: true, name: true, role: true },
    }));

  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name ?? null,
    role: dbUser.role,
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
