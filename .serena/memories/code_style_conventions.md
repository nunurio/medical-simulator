# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (strict: true)
- **Target**: ES2017
- **Module System**: ESNext with bundler module resolution
- **JSX**: Preserve mode for Next.js processing
- **Path Aliases**: `@/*` maps to `./src/*`

## File Organization
- Source code is in the `src/` directory
- App Router structure with files in `src/app/`
- Public assets in `public/` directory

## Component Style
- Functional components with default exports
- Tailwind CSS for styling using utility classes
- Dark mode support with `dark:` prefixes
- Responsive design with breakpoint prefixes (sm:, md:, etc.)

## Import Conventions
- Use path aliases: `import from '@/...'` for src imports
- Next.js specific imports: `import Image from "next/image"`

## ESLint Configuration
- Extends `next/core-web-vitals` and `next/typescript`
- Using flat config format with @eslint/eslintrc compatibility

## Naming Conventions
- Component files: PascalCase (e.g., RootLayout.tsx, Home.tsx)
- CSS modules/styles: lowercase (e.g., globals.css)
- Configuration files: lowercase with appropriate extensions