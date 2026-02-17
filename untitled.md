# MarcheOS MVP (Next.js) — Project Rules

## Goal
Build an MVP that connects Organizers (municipality / facility / shopping street) and Vendors (shops) to run a market:
- Organizers: create event -> publish call -> review applications -> accept/reject -> export report
- Vendors: profile -> apply -> track status
No consumer-facing marketplace in MVP.

## Tech
- Next.js (App Router) + TypeScript
- pnpm
- Prisma + PostgreSQL
- Auth: NextAuth (role-based: ORGANIZER / VENDOR / ADMIN)
- UI: minimal shadcn/ui or simple Tailwind
- Deploy: Vercel

## Non-negotiables (Security & Compliance)
- Store minimum PII. No unnecessary fields (no birthday, no address by default).
- All actions must be authorized server-side (RBAC).
- Audit log for organizer decisions (who/when/what).
- Never run unknown scripts. If a command is risky, ask before running.
- Secrets only via env vars. Never commit secrets.

## Deliverables
- Working MVP with seed data and README for local run + deployment
- Basic tests for auth + critical flows

