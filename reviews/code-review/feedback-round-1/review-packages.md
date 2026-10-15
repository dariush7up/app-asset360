## Package audit: Asset 360

Lockfile: `package-lock.json` is present (not ignored, not yet committed).

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/aura | 0.3.5 | 1.46472.0 | no | 4 low (transitive: mermaid, katex) | Warn (1 major behind) |
| @cognite/app-sdk | 0.9.0 | 0.46522.0 | no | none | Warn (version scheme jumped; confirm upgrade path) |
| @cognite/sdk | ^10.10.0 | current | not checked (not flagged) | none | Pass |
| react / react-dom | 18.3.1 | 19.3.0 | no | none | Warn (1 major behind) |
| @tanstack/react-table | 8.21.3 | 9.2.8 | no | none | Warn (1 major behind; Aura peer) |
| @tanstack/react-query | 5.104.1 | 5.104.2 | no | none | Pass |
| @tanstack/react-virtual | 3.14.14 | 3.14.15 | no | none | Pass |
| recharts | 3.10.1 | current | no | none | Pass |
| @tabler/icons-react, clsx, tailwind-merge | current | current | not checked | none | Pass (clsx and tailwind-merge are only used by the unused `src/lib/utils.ts`) |

Dev dependencies one major behind (not counted against 1.3): vite 7→8, vitest and @vitest/* 4→5, eslint and @eslint/js 9→10, typescript 5→7, @types/react and @types/react-dom 18→19, @testing-library/jest-dom 6→7, @vitejs/plugin-react 5→6.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 4 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| @vitest/mocker (via vitest, @vitest/ui, @vitest/coverage-v8) | Moderate | Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock | vitest/@vitest/ui 4.1.11 (non-major) | dev-only |
| katex (via mermaid, @streamdown/mermaid, @cognite/aura) | Low | KaTeX: Existing prototype pollution can bypass trust restrictions | needs @cognite/aura update (npm reports a semver-major fix) | transitive of a production dependency |
