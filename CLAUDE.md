# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style

- **Thinking Process**: Please conduct your thinking process in English.
- **Responses**: Please provide all responses in Japanese.

## Working Policy

- All operations to understand the project structure, implementation details, and read files must be performed using Serena MCP.

## Project Overview

This is a medical simulator application built with Next.js 15.4.5 (App Router), React 19.1.0, and TypeScript. Currently in initial development stage.

## Essential Commands

### Development
```bash
pnpm dev        # Start development server with Turbopack at http://localhost:3000
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

### Package Management
```bash
pnpm install              # Install dependencies
pnpm add <package>        # Add runtime dependency
pnpm add -D <package>     # Add dev dependency
```

### Testing
Vitest is configured but no test script is in package.json. To run tests:
```bash
pnpm vitest              # Run tests once
```

Note: `vitest.config.ts` has a hardcoded path that needs updating for your environment.

## Architecture

### Directory Structure
- `/src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind directives
- `/public/` - Static assets

### Key Technologies
- **Framework**: Next.js with App Router and Turbopack
- **Styling**: Tailwind CSS v4 with PostCSS
- **TypeScript**: Strict mode enabled with path alias `@/*` → `./src/*`
- **Testing**: Vitest with tdd-guard-vitest reporter

### Development Notes
- The project uses pnpm as package manager (v10.12.1)
- ESLint 9.32.0 with Next.js configuration
- TypeScript target is ES2017 with strict mode
- No medical-specific functionality implemented yet - this is a fresh Next.js installation

### Next.js Best Practices

- **RSC (React Server Components) First**: Default to RSC. Use `'use client'` only when necessary (hooks, event handlers).
- **Server Actions for Mutations**: Use Server Actions for form submissions and data mutations. Avoid API Routes.
- **Data Fetching**:
    - **Server**: Use `fetch` within RSCs, controlling cache with `next: { revalidate: ... }`.
    - **Client**: Use SWR (`useSWR`) for client-side data fetching.
- **UI States**: Utilize special files for UI states:
    - `loading.tsx` for loading UI.
    - `error.tsx` for error boundaries.
    - `not-found.tsx` for 404 pages.
- **Performance Optimization**:
    - **Images**: Always use `<Image>` from `next/image`.
    - **Fonts**: Optimize fonts with `next/font`.
    - **Dynamic Imports**: Use `dynamic` from `next/dynamic`, not `React.lazy`.
- **`useEffect` Usage**: Avoid `useEffect` for data fetching. Limit its use to client-side specific logic (like DOM manipulation) and encapsulate it within custom hooks.
## TDD (Test-Driven Development)

This project follows the TDD approach, inspired by the methodology of Takuto Wada (@t-wada), using the "Red-Green-Refactor" cycle. This ensures we build a robust and maintainable codebase.
- **Red**: Write a failing test that specifies the desired behavior.
- **Green**: Write the simplest code to make the test pass.
- **Refactor**: Clean up and improve the code while ensuring tests remain green.

