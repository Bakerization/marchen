-- Create enums for photo categories
CREATE TYPE "EventPhotoType" AS ENUM ('HERO', 'VENUE', 'MAP', 'POSTER', 'GALLERY');
CREATE TYPE "VendorPhotoType" AS ENUM ('LOGO', 'SHOP', 'PRODUCT', 'MENU', 'OTHER');

-- Create event photos table
CREATE TABLE "event_photos" (
  "id" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "type" "EventPhotoType" NOT NULL DEFAULT 'GALLERY',
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "eventId" TEXT NOT NULL,
  CONSTRAINT "event_photos_pkey" PRIMARY KEY ("id")
);

-- Create vendor photos table
CREATE TABLE "vendor_photos" (
  "id" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "type" "VendorPhotoType" NOT NULL DEFAULT 'PRODUCT',
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "vendorId" TEXT NOT NULL,
  CONSTRAINT "vendor_photos_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "event_photos_eventId_type_idx" ON "event_photos"("eventId", "type");
CREATE INDEX "vendor_photos_vendorId_type_idx" ON "vendor_photos"("vendorId", "type");

-- Foreign keys
ALTER TABLE "event_photos"
  ADD CONSTRAINT "event_photos_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_photos"
  ADD CONSTRAINT "vendor_photos_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendor_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
