# CLAUDE.md — Project Guidelines for marchen

## Project Overview

This is a Next.js (App Router) project with React and TypeScript.Build an MVP that connects Organizers (municipality / facility / shopping street) and Vendors (shops) to run a market:
- Organizers: create event -> publish call -> review applications -> accept/reject -> export report
- Vendors: profile -> apply -> track status
No consumer-facing marketplace in MVP.


## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- Prisma + PostgreSQL
- Auth: NextAuth (role-based: ORGANIZER / VENDOR / ADMIN)
- UI: minimal shadcn/ui or simple Tailwind
- Deploy: Vercel

## Commands

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm format` — Run Prettier
- `pnpm test` — Run tests

## Project Structure

```
src/
  app/          # App Router pages and layouts
  components/   # Reusable React components
  lib/          # Utility functions and shared logic
  hooks/        # Custom React hooks
  types/        # TypeScript type definitions
public/         # Static assets
```

## Code Conventions

- Use functional components with TypeScript interfaces for props
- Prefer named exports over default exports (except for pages/layouts)
- Use `const` arrow functions for components: `const MyComponent = () => {}`
- Keep components small and focused — extract when a component exceeds ~100 lines
- Colocate tests next to the files they test (e.g., `Button.test.tsx` beside `Button.tsx`)

## Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types/Interfaces**: PascalCase with no prefix (`UserProfile`, not `IUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

## Git Conventions

- Commit messages: imperative mood, lowercase start (e.g., "add user auth flow")
- Branch names: `feature/`, `fix/`, `chore/` prefixes

## Important Notes

- Always use Server Components by default; add `"use client"` only when needed
- Keep `"use client"` boundaries as low in the component tree as possible
- Use Next.js `<Image>` and `<Link>` components instead of native HTML equivalents
- Environment variables for the browser must be prefixed with `NEXT_PUBLIC_`

## Non-negotiables (Security & Compliance)
- Store minimum PII. No unnecessary fields (no birthday, no address by default).
- All actions must be authorized server-side (RBAC).
- Audit log for organizer decisions (who/when/what).
- Never run unknown scripts. If a command is risky, ask before running.
- Secrets only via env vars. Never commit secrets.

## Deliverables
- Working MVP with seed data and README for local run + deployment
- Basic tests for auth + critical flows


