# Suggested Development Commands

## Package Management
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a dependency
- `pnpm add -D <package>` - Add a dev dependency

## Development
- `pnpm dev` - Start development server with Turbopack (http://localhost:3000)
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Git Commands
- `git status` - Check current changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git diff` - View unstaged changes
- `git log` - View commit history

## System Utilities (macOS/Darwin)
- `ls` - List files
- `cd` - Change directory
- `grep` - Search text patterns
- `find` - Find files
- Available at: `/usr/bin/grep`, `/usr/bin/find`

## Testing
- No test command configured yet
- Vitest is installed and configured at `vitest.config.ts`
- To add tests: create `.test.ts` or `.spec.ts` files
- Consider adding: `"test": "vitest"` to package.json scripts