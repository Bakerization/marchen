import { prisma } from "@/lib/prisma";

interface AuditEntry {
  userId: string;
  action: string;
  eventId?: string;
  applicationId?: string;
  details?: string;
}

/**
 * Write an audit log entry.
 * Call this whenever an organizer makes a decision (accept/reject/publish).
 */
export const logAudit = async (entry: AuditEntry) => {
  return prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      eventId: entry.eventId ?? null,
      applicationId: entry.applicationId ?? null,
      details: entry.details ?? null,
    },
  });
};
