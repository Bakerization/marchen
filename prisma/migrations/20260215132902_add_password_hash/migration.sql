-- AlterTable: add passwordHash with a placeholder for existing rows
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';

-- Remove the default after backfill (seed will set real hashes)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;
