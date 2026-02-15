import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// All seed users share the same password for local dev
const SEED_PASSWORD = "password123";
const hash = hashSync(SEED_PASSWORD, 10);

async function main() {
  console.log("Seeding database...");
  console.log(`Seed password for all users: ${SEED_PASSWORD}`);

  // Clean existing data (order matters for FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.document.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizerProfile.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  // --- Users -----------------------------------------------------------

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@marchen.local",
      name: "Admin",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      email: "organizer@marchen.local",
      name: "Tanaka Ichiro",
      passwordHash: hash,
      role: "ORGANIZER",
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      email: "vendor1@marchen.local",
      name: "Sato Yuki",
      passwordHash: hash,
      role: "VENDOR",
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: "vendor2@marchen.local",
      name: "Suzuki Hana",
      passwordHash: hash,
      role: "VENDOR",
    },
  });

  // --- Profiles --------------------------------------------------------

  const orgProfile = await prisma.organizerProfile.create({
    data: {
      organizationName: "Shibuya Shopping District Association",
      contactPhone: "03-1234-5678",
      website: "https://shibuya-market.example.com",
      userId: organizerUser.id,
    },
  });

  const vendorProfile1 = await prisma.vendorProfile.create({
    data: {
      shopName: "Sato's Kitchen",
      description: "Homemade bento and onigiri",
      category: "food",
      contactPhone: "090-1111-2222",
      userId: vendorUser1.id,
    },
  });

  const vendorProfile2 = await prisma.vendorProfile.create({
    data: {
      shopName: "Hana Crafts",
      description: "Handmade pottery and ceramics",
      category: "crafts",
      contactPhone: "090-3333-4444",
      userId: vendorUser2.id,
    },
  });

  // --- Documents -------------------------------------------------------

  await prisma.document.create({
    data: {
      fileName: "food-license.pdf",
      fileUrl: "https://storage.example.com/docs/food-license.pdf",
      mimeType: "application/pdf",
      sizeBytes: 204800,
      vendorId: vendorProfile1.id,
    },
  });

  // --- Events ----------------------------------------------------------

  const event1 = await prisma.event.create({
    data: {
      title: "Shibuya Spring Market 2026",
      description: "Annual spring market in Shibuya featuring food and crafts",
      location: "Shibuya Miyashita Park",
      eventDate: new Date("2026-04-12T10:00:00Z"),
      deadline: new Date("2026-03-20T23:59:59Z"),
      status: "OPEN",
      maxVendors: 30,
      organizerId: orgProfile.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Shibuya Summer Night Market",
      description: "Evening market with food stalls and live music",
      location: "Shibuya Stream Hall",
      eventDate: new Date("2026-07-18T17:00:00Z"),
      deadline: new Date("2026-06-30T23:59:59Z"),
      status: "DRAFT",
      maxVendors: 20,
      organizerId: orgProfile.id,
    },
  });

  // --- Applications ----------------------------------------------------

  const app1 = await prisma.application.create({
    data: {
      message: "We'd love to bring our bento and onigiri to the spring market!",
      status: "ACCEPTED",
      vendorId: vendorProfile1.id,
      eventId: event1.id,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      message: "Interested in showcasing our ceramic collection.",
      status: "PENDING",
      vendorId: vendorProfile2.id,
      eventId: event1.id,
    },
  });

  await prisma.application.create({
    data: {
      message: "We can do a special summer bento set menu.",
      status: "PENDING",
      vendorId: vendorProfile1.id,
      eventId: event2.id,
    },
  });

  // --- Audit Logs ------------------------------------------------------

  await prisma.auditLog.create({
    data: {
      action: "EVENT_PUBLISHED",
      details: "Spring Market 2026 opened for applications",
      userId: organizerUser.id,
      eventId: event1.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "APPLICATION_ACCEPTED",
      details: "Accepted Sato's Kitchen for Spring Market",
      userId: organizerUser.id,
      eventId: event1.id,
      applicationId: app1.id,
    },
  });

  console.log("Seed complete.");
  console.log({
    users: [adminUser.email, organizerUser.email, vendorUser1.email, vendorUser2.email],
    events: [event1.title, event2.title],
    applications: 3,
    auditLogs: 2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
