import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkWeather } from "@/lib/weather";

/**
 * Daily weather check for upcoming events.
 * Vercel Cron: { "path": "/api/cron/weather", "schedule": "0 8 * * *" }
 */
export const GET = async (request: Request) => {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayStart = new Date(tomorrow);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tomorrow);
  dayEnd.setHours(23, 59, 59, 999);

  // Find events happening tomorrow
  const events = await prisma.event.findMany({
    where: {
      eventDate: { gte: dayStart, lte: dayEnd },
      status: { in: ["OPEN", "CLOSED"] },
    },
  });

  let updated = 0;

  for (const event of events) {
    // Default Tokyo coordinates if location coords not stored
    // In production, geocode event.location
    const lat = 35.6762;
    const lng = 139.6503;

    const forecast = await checkWeather(lat, lng, event.eventDate);

    await prisma.weatherAlert.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        summary: forecast.summary,
        riskLevel: forecast.riskLevel,
        source: "openweathermap",
      },
      update: {
        summary: forecast.summary,
        riskLevel: forecast.riskLevel,
        capturedAt: new Date(),
      },
    });

    updated++;
  }

  return NextResponse.json({ message: "Weather checked", updated });
};
