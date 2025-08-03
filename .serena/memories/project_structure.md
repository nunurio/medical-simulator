# Project Structure

```
medical-simulator-app/
├── .serena/          # Serena configuration
├── .claude/          # Claude-specific files
├── public/           # Static assets
│   ├── favicon.ico
│   └── *.svg        # Various SVG icons
├── src/             # Source code
│   └── app/         # Next.js App Router
│       ├── favicon.ico
│       ├── globals.css    # Global styles with Tailwind
│       ├── layout.tsx     # Root layout component
│       └── page.tsx       # Home page component
├── .gitignore
├── eslint.config.mjs      # ESLint flat config
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml        # Lock file for pnpm
├── postcss.config.mjs    # PostCSS with Tailwind
├── README.md             # Project documentation
├── tsconfig.json         # TypeScript configuration
└── vitest.config.ts      # Vitest test configuration
```

## Key Directories
- `/src/app/` - Next.js App Router pages and layouts
- `/public/` - Static assets served directly
- Root config files for various tools

## Not Yet Created
- `/src/components/` - Reusable React components
- `/src/lib/` or `/src/utils/` - Utility functions
- `/src/types/` - TypeScript type definitions
- Test files (`*.test.ts`, `*.spec.ts`)