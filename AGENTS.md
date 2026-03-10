# AGENTS.md — MeetMerge

## Project Overview

MeetMerge is a Next.js webapp for coordinating group meeting availability.
Users create a group, share the link, enter availability on a 3-week calendar grid
(actual dates, not generic days), and view overlapping availability across all
participants. Data is stored in Firebase Firestore for real-time shared access.
Participant sessions are stored in localStorage per group so returning visitors
see their existing availability for editing rather than a new join form.

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Firebase Firestore, Vitest

## Build / Lint / Test Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (deployed to Vercel)
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run lint         # ESLint (flat config, eslint.config.mjs)
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier — format all src files
npm run format:check # Prettier — check formatting without writing
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

### Running a Single Test

```bash
# By file path
npx vitest run src/lib/overlap.test.ts

# By test name pattern
npx vitest run -t "counts overlapping blocks"

# Watch a single file
npx vitest src/lib/overlap.test.ts
```

Test files live next to source files with the `.test.ts` or `.test.tsx` suffix.
Tests use Vitest with jsdom environment. Setup file: `src/test/setup.ts`.

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (Geist font, Tailwind)
│   ├── page.tsx                # Home — create a new group
│   ├── globals.css             # Global styles + Tailwind import
│   └── group/[groupId]/
│       ├── page.tsx            # Enter availability (week grid)
│       └── view/page.tsx       # View group overlap
├── components/                 # Reusable React components
│   ├── WeekGrid.tsx            # Interactive weekly availability grid
│   ├── OverlapGrid.tsx         # Read-only overlap heatmap grid
│   └── SubmissionCounter.tsx   # Participant count badge
├── lib/                        # Pure logic and utilities
│   ├── dates.ts                # Date range generation + formatting
│   ├── firebase.ts             # Firebase app + Firestore initialization
│   ├── overlap.ts              # Overlap computation
│   ├── overlap.test.ts         # Tests for overlap logic
│   ├── session.ts              # localStorage session per group
│   ├── storage.ts              # Firestore CRUD operations
│   └── useGroup.ts             # Real-time group subscription hook
├── types/                      # TypeScript type definitions
│   ├── availability.ts         # Core domain types
│   └── index.ts                # Barrel re-exports
└── test/
    └── setup.ts                # Vitest setup (jest-dom matchers)
```

## Code Style Guidelines

### TypeScript & Types

- **Strict mode is enabled** (`"strict": true` in tsconfig.json). Never use `any`.
- Use `interface` for object shapes; use `type` for unions, intersections, and aliases.
- Prefer explicit return types on exported functions. Inline return types are fine
  for component event handlers and small callbacks.
- Import types with `import type { ... }` to keep runtime bundles clean.
- Use the path alias `@/` which maps to `./src/*` (e.g., `import { loadGroup } from "@/lib/storage"`).

### Imports

- Order: (1) React/Next.js, (2) third-party packages, (3) `@/` project imports.
- Use named exports for components and utilities. Default exports only for page components
  (required by Next.js App Router).
- Barrel re-exports in `types/index.ts` — import types from `@/types`.

### Naming Conventions

- **Files:** PascalCase for components (`WeekGrid.tsx`), camelCase for utilities (`overlap.ts`).
- **Components:** PascalCase function names, named exports (`export function WeekGrid`).
- **Types/Interfaces:** PascalCase (`TimeBlock`, `OverlapBlock`).
- **Functions/variables:** camelCase (`computeOverlap`, `formatHour`).
- **Constants:** UPPER_SNAKE_CASE for static lookup objects (`DAY_LABELS`).
- **Props interfaces:** `ComponentNameProps` (e.g., `WeekGridProps`).

### React Patterns

- All pages and interactive components use `"use client"` directive.
- Avoid `setState` inside `useEffect`. Use `useSyncExternalStore` for reading from
  external stores (like localStorage) to avoid cascading renders. This is enforced
  by the `react-hooks/set-state-in-effect` ESLint rule.
- For Firestore data, use the `useGroup` hook (`src/lib/useGroup.ts`) which wraps
  `onSnapshot` for real-time updates. The `setState` calls happen inside the snapshot
  callback (async), not synchronously in the effect body.
- Use `useCallback` for event handlers passed to child components.
- Use `useMemo` for derived/computed values.

### Styling

- **Tailwind CSS 4** exclusively — no CSS modules, no styled-components.
- Mobile-first responsive design: start with base styles, add `sm:`, `md:`, `lg:` breakpoints.
- Dark mode via `dark:` variant (follows `prefers-color-scheme`).
- Use semantic spacing and sizing (`px-4`, `py-3`, `gap-2`, `space-y-6`).

### Error Handling

- Firestore operations wrapped in try/catch with `console.error` on failure.
- Read operations return `null` on failure for graceful degradation.
- Validate user input before state mutations (e.g., check `name.trim()` before submit).
- Use disabled states on buttons with `disabled:opacity-50 disabled:cursor-not-allowed`.

### Formatting (Prettier)

- Double quotes, semicolons, trailing commas (`"all"`).
- 2-space indentation, 100 char print width.
- Config in `.prettierrc`.

### Testing

- Test files are co-located with source: `overlap.test.ts` next to `overlap.ts`.
- Use `describe` / `it` / `expect` from Vitest.
- Test pure logic (lib/) thoroughly. Component tests use `@testing-library/react`.
- Keep tests focused — one assertion concept per `it` block.

## Architecture Decisions

- **No backend.** All state lives in Firebase Firestore (`groups` collection, keyed by UUID).
- **Dynamic routes** (`/group/[groupId]`) are server-rendered on demand by Vercel.
- The home page (`/`) is statically generated.
- Groups are identified by UUID v4. Each group has an `ownerId`.
- The group owner (creator) can edit or remove any participant from the view page.
- The week grid shows hours 7 AM – 10 PM (indices 7–22), Sunday through Saturday.
- The week grid supports click-and-drag to select/deselect rectangular blocks.
- Overlap intensity is shown as a green heatmap scaled by `count / totalParticipants`.
- The current user's blocks are highlighted with a blue ring in the overlap view.

## Deployment

Deployed to **Vercel**. Push to main triggers automatic deployment.
Firebase config is provided via `NEXT_PUBLIC_FIREBASE_*` environment variables
(see `.env.local.example`). Set these in Vercel project settings for production.
