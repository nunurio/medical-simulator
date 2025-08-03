# Task Completion Checklist

When completing any coding task in this project, ensure you:

## 1. Code Quality
- [ ] Run linting: `pnpm lint`
- [ ] Fix any ESLint errors or warnings
- [ ] Ensure TypeScript strict mode compliance

## 2. Testing
- [ ] Write tests if implementing new features (using Vitest)
- [ ] Run tests if available: `pnpm test` (needs to be added to scripts)
- [ ] Verify functionality in browser: `pnpm dev`

## 3. Build Verification  
- [ ] Run production build: `pnpm build`
- [ ] Ensure build completes without errors
- [ ] Test production build locally: `pnpm start`

## 4. Code Review
- [ ] Follow existing code patterns and conventions
- [ ] Use TypeScript types properly
- [ ] Follow Tailwind CSS utility class conventions
- [ ] Ensure responsive design with appropriate breakpoints

## 5. Git Hygiene
- [ ] Review changes: `git status` and `git diff`
- [ ] Stage appropriate files: `git add`
- [ ] Write clear commit messages

## Important Notes
- Currently no formatter configured (consider adding Prettier)
- No pre-commit hooks configured
- Testing infrastructure (Vitest) is set up but no test script in package.json