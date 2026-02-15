# Marchen — Market Management Platform

MVP connecting **Organizers** (municipalities, facilities, shopping streets) with **Vendors** (shops, stalls) to run markets.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string (e.g. Neon, local Postgres)

# 3. Run migrations
pnpm db:migrate

# 4. Seed sample data
pnpm db:seed

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start dev server (Turbopack)         |
| `pnpm build`       | Production build                     |
| `pnpm lint`        | Run ESLint                           |
| `pnpm db:generate` | Regenerate Prisma client             |
| `pnpm db:migrate`  | Create & apply migrations            |
| `pnpm db:seed`     | Seed database with sample data       |
| `pnpm db:reset`    | Reset database (drop + migrate + seed) |

## Tech Stack

- **Next.js 16** (App Router) + TypeScript (strict)
- **Tailwind CSS** for styling
- **Prisma 7** + PostgreSQL (Neon-compatible)
- **pnpm** package manager

## Schema Rationale

```
User  1──1  OrganizerProfile
User  1──1  VendorProfile
OrganizerProfile  1──*  Event
VendorProfile     1──*  Application  *──1  Event
VendorProfile     1──*  Document
User              1──*  AuditLog     *──?  Event
                                     *──?  Application
```

### Why separate profile tables?

**User** is a thin authentication record (email, role). Role-specific data lives in **OrganizerProfile** and **VendorProfile**:

- **Minimal PII**: User table stores only what auth needs. Business data (org name, shop name, phone) is isolated in profiles — easy to scope access and comply with data-minimization rules.
- **Independent evolution**: Organizer fields (website, org name) and vendor fields (shop name, category) change at different rates. Separate tables avoid nullable-field sprawl.
- **Clean relations**: Events belong to an OrganizerProfile (not a User), Applications belong to a VendorProfile. This makes RBAC queries natural — no need to check roles when traversing relations.

### Other design decisions

| Model         | Rationale |
| ------------- | --------- |
| **Event**     | Owns `status` lifecycle (DRAFT → OPEN → CLOSED → COMPLETED). `maxVendors` caps accepted applications. `deadline` enforces application cutoff. |
| **Application** | Unique constraint on `(vendorId, eventId)` prevents duplicate applications. Tracks its own status independently of the event. |
| **Document**  | MVP stores metadata only (`fileName`, `fileUrl`, `mimeType`, `sizeBytes`). Actual files live in object storage (S3 / Vercel Blob). Attached to VendorProfile, not Application, so docs persist across events. |
| **AuditLog**  | Immutable append-only log. Links to `userId` (who), `eventId` (context), and optionally `applicationId` (what was decided on). Satisfies the compliance requirement for decision traceability. |

### Seed data

The seed script (`prisma/seed.ts`) creates:

- 1 admin, 1 organizer (with profile), 2 vendors (with profiles)
- 2 events: "Shibuya Spring Market 2026" (OPEN) and "Shibuya Summer Night Market" (DRAFT)
- 3 applications (1 accepted, 2 pending)
- 1 document (food license PDF)
- 2 audit log entries (event published, application accepted)

## Deployment

Deploy to [Vercel](https://vercel.com) with a Neon PostgreSQL database. Set `DATABASE_URL` in Vercel environment variables.
