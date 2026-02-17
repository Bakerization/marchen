import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/mailer";

/**
 * Vercel Cron-compatible route for sending volunteer reminders.
 * Schedule: daily at 07:00 and 18:00 JST
 *
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 7,18 * * *" }] }
 */
export const GET = async (request: Request) => {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getHours();

  // Determine which type of reminder to send
  const isEve = currentHour >= 16 && currentHour <= 20;
  const isMorning = currentHour >= 5 && currentHour <= 9;

  if (!isEve && !isMorning) {
    return NextResponse.json({ message: "Not a reminder time", sent: 0 });
  }

  // Find events happening tomorrow (for eve) or today (for morning)
  const targetDate = new Date(now);
  if (isEve) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      eventDate: { gte: dayStart, lte: dayEnd },
      status: { in: ["OPEN", "CLOSED"] },
    },
    include: {
      volunteerInvites: {
        where: { status: "CONFIRMED" },
      },
    },
  });

  let sent = 0;

  for (const event of events) {
    for (const vol of event.volunteerInvites) {
      await sendReminder({
        email: vol.email,
        name: vol.name,
        eventTitle: event.title,
        eventDate: event.eventDate.toLocaleDateString("ja-JP"),
        location: event.location,
        type: isEve ? "eve" : "morning",
      });
      sent++;
    }
  }

  return NextResponse.json({ message: "Reminders sent", sent });
};
