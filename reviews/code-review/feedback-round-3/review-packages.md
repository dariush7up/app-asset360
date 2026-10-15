## Package audit: Asset 360 (round 3)

Lockfile: `package-lock.json` is present (not ignored, not yet committed).

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| **react-pdf** | 9.2.1 | 11.0.0 | no | none | **Fail (2 majors behind, no documented plan).** 10.x supports React 18; 11.x needs React 19 |
| @cognite/aura | 0.3.5 | 1.46571.0 | no | 4 low (transitive: mermaid, katex) | Warn (1 major behind) |
| @cognite/app-sdk | 0.9.0 | 0.11.0 | no | none | Warn (minor versions; still 0.x) |
| react / react-dom | 18.3.1 | 19.3.0 | no | none | Warn (1 major behind; Aura and the app SDK require React 18) |
| @tanstack/react-table | 8.21.3 | 9.2.8 | no | none | Warn (1 major behind; Aura peer is `^8`) |
| @tanstack/react-query | 5.104.1 | 5.104.2 | no | none | Pass |
| @tanstack/react-virtual | 3.14.14 | 3.14.17 | no | none | Pass |
| recharts, @cognite/sdk, @tabler/icons-react | current | current | not flagged | none | Pass |

Dev dependencies one major behind (not counted against 1.3): vite 7→8, vitest and @vitest/* 4→5, eslint and @eslint/js 9→10, typescript 5→7, @types/react and @types/react-dom 18→19, @testing-library/jest-dom 6→7, @vitejs/plugin-react 5→6, happy-dom 20→21.

`react-pdf` also pulls in an optional native `canvas` package that npm reports as having an install script not covered by `allowScripts`; it is skipped at install and unused in the browser.

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
| @vitest/mocker (via vitest, @vitest/ui, @vitest/coverage-v8) | Moderate | Path traversal / arbitrary file read via mock redirect | 4.1.11 (non-major) | dev-only |
| katex (via mermaid, @streamdown/mermaid, @cognite/aura) | Low | Prototype pollution can bypass trust restrictions | needs an @cognite/aura update | transitive of a production dependency |
