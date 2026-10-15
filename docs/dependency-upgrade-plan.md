# Dependency upgrade plan

Written for the code review criterion 1.3 (packages). Last updated October 2026.

## Constraint: stay on React 18, react-table 8 and react-pdf 10 for now

The latest `@cognite/aura` (1.46472.0) and `@cognite/app-sdk` (0.10.0) both declare `react: ^18.3.1` as a peer dependency, and Aura declares `@tanstack/react-table: ^8.7.4`. Upgrading `react`/`react-dom` to 19 or `@tanstack/react-table` to 9 would break those peer ranges, so those two "one major behind" findings are not actionable until Aura and the app SDK support them. Revisit when a new Aura release changes its peer ranges.

`react-pdf` 11.x declares `react: ^19.0.0` as a peer dependency, so it is blocked by the same React 18 constraint. The app has been upgraded from 9.2.1 to 10.5.0 (the latest React 18-compatible major). Move to 11 when Aura and app-sdk support React 19.

## Completed

1. ~~**Upgrade `@cognite/aura` 0.3.5 to 1.46472.0.**~~ Done. Required adding `server.deps.inline: ['@cognite/aura']` to `vitest.config.ts` because Aura 1.x reads `import.meta.env.VITEST` at module scope. All Aura component APIs (Command, DataGrid, Chart, Tabs, Breadcrumb, EmptyState, etc.) are backward-compatible — tsc, lint and all 208 tests pass. The 8 low-severity advisories (katex, mermaid, remark) are still present in Aura 1.x's transitive tree.
2. ~~**Apply patch updates.**~~ `@tanstack/react-virtual` 3.14.14 → 3.14.15 applied. `@tanstack/react-query` was already current.
3. ~~**Upgrade `react-pdf` 9.2.1 to 10.5.0.**~~ Done. React 18-compatible; v11 needs React 19.

## Steps remaining

1. **Upgrade `@cognite/app-sdk` 0.9.0 to 0.10.0+.** Peers: `vite 8.x`, `@cognite/sdk ^10.14.0`, react 18. This needs the Vite 7→8 upgrade first and a newer `@cognite/sdk` (currently `^10.10.0`).
2. **Upgrade Vite 7 to 8** together with `@vitejs/plugin-react` 5→6 and check `vite.config.ts` (the app SDK plugins are loaded from there).
3. **Upgrade `vitest` and `@vitest/ui` 4.1.10 → 5.x** (addresses the moderate dev-only `@vitest/mocker` advisory). This is a major version bump — check for breaking config or API changes.

## How to verify each step

`npm run lint`, `npx tsc --noEmit`, `npx vitest run --coverage`, `npm run build`, then open the app in Fusion and check search, the asset page, the chart, P&IDs, files, work orders and child assets. Do one step per commit so a regression is easy to bisect. Use npm 11 (`npx npm@11 install`), as the repo requires.
