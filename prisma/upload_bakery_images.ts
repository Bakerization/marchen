import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Simple image uploader: pulls placeholder bread photos from Unsplash's featured endpoint
// and uploads them to Vercel Blob, then stores the blob URL in Documents.

const connectionString = process.env.DATABASE_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const sourcePool = Array.from({ length: 200 }, (_, i) => ({
  url: `https://images.unsplash.com/featured/1200x800?bread,bakery&sig=${i + 1}`,
  ext: "jpg",
}));

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchAndUpload(srcUrl: string, filename: string): Promise<string | null> {
  if (!token) {
    console.warn("BLOB_READ_WRITE_TOKEN not set; skipping upload.");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(srcUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`fetch failed ${srcUrl}: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const upload = await fetch("https://blob.vercel-storage.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-vercel-filename": filename,
        "content-type": contentType,
      },
      body: buffer,
    });

    if (!upload.ok) {
      console.warn(`upload failed for ${srcUrl}: ${upload.status} ${await upload.text()}`);
      return null;
    }

    const json = (await upload.json()) as { url?: string };
    return json.url ?? null;
  } catch (err) {
    console.warn(`upload error for ${srcUrl}:`, err);
    return null;
  }
}

async function main() {
  const limit = Number(process.argv[2]) || 120;
  console.log(`Uploading images for up to ${limit} vendors...`);

  const vendors = await prisma.vendorProfile.findMany({
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let uploaded = 0;
  for (let i = 0; i < vendors.length; i++) {
    const vendor = vendors[i];
    const hasPhoto = await prisma.document.findFirst({
      where: { vendorId: vendor.id, mimeType: { contains: "image" } },
    });
    if (hasPhoto) continue;

    const poolItem = sourcePool[i % sourcePool.length];
    const filename = `${vendor.shopName.replace(/[^a-zA-Z0-9-_]+/g, "-") || "bakery"}-${i
      .toString()
      .padStart(3, "0")}.${poolItem.ext}`;

    const url = await fetchAndUpload(poolItem.url, filename);
    if (!url) continue;

    await prisma.document.create({
      data: {
        fileName: filename,
        fileUrl: url,
        mimeType: "image/jpeg",
        sizeBytes: 0,
        vendorId: vendor.id,
      },
    });
    uploaded += 1;
    // Be gentle to Unsplash & Vercel APIs
    await sleep(400);
  }

  console.log(`Uploaded ${uploaded} images.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
