export const ROLES = ["ADMIN", "ORGANIZER", "VENDOR"] as const;
export type Role = (typeof ROLES)[number];

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}
