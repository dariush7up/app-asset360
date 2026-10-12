# Asset 360 — Flows design review (round 1)

This document is the design quality assessment for Asset 360, conducted as part of the Cognite Flows app certification process.

## Primary user and tasks

- **Primary user:** Reliability Engineer at an industrial facility, working at a desk on a standard desktop/laptop with a large monitor.
- **Critical tasks:**
  1. Search for a flagged asset by tag name
  2. Review the asset's live time-series data, work orders, and linked documents (P&ID, manuals) in one view
  3. Prepare a maintenance briefing from that single view
- **Success criteria:** Complete an asset investigation within 5 minutes (down from 1-2 hours).

## Task walkthrough

The user walked through the app as a Reliability Engineer. Significant issues were reported:

1. **Search / finding assets:** Difficulty finding the right asset. The search experience was confusing.
2. **Navigation / layout:** Unclear where the user was in the app; hard to orient within the page structure.
3. **Time series and P&ID not showing:** Browsed many assets but none had linked time series or P&IDs. This appears to be a data issue (assets in the test CDF project don't have time series or files linked via the CDM data model), not a code bug. The app correctly shows empty states in those cases.
4. **Text overlap in work orders table:** Long work order titles overflowed into the Status and Date columns due to Aura Button's `shrink-0 whitespace-nowrap` classes not being overridden in the custom DataGrid cell renderer. **Fixed during this review** by adding `min-w-0 shrink truncate` to Button cells in WorkOrdersPanel and DocumentsPanel.

## Scores

| Q | Topic | Score | Rationale | Improvement |
|---|---|---|---|---|
| Q1 | Aura design system consistency | 4/5 | Aura 1.46472.0 used throughout (14 files). 0 hard-coded colors, 0 raw rgb/hsl. Minor: raw `bg-muted/50` in fallbacks, error `<p>` tags instead of Aura Alert. | Use Aura Alert for error paragraphs; use semantic tokens for fallback backgrounds. |
| Q2 | Navigation, layout and hierarchy | 3/5 | State-driven navigation with breadcrumb is functional but the user reported getting lost. Single-page structure without strong enough location cues beyond the breadcrumb. No routes — the app uses host-synced state. | Strengthen location indicators: highlight the active panel, add a page title that reflects the selected asset, consider a sidebar or tab navigation for the asset detail panels. |
| Q3 | Clear labels and language | 3/5 | 0 vague button labels in automated probes. However, the user reported confusion when searching for assets — the search UX and result presentation weren't clear enough despite passing automated label checks. | Improve search result presentation: show more context per result (description, parent path), add "no results" guidance, consider type-ahead suggestions. |
| Q4 | System feedback and validation | 4/5 | Loading states in 15 files, error states in 5, ErrorBoundary in 4. Every panel has loading/error/empty states via the Section component. Read-only app, so no mutation feedback needed. | Cover the AssetPage error/no-access/retry branches more visibly. |
| Q5 | Clickability and interactions | 5/5 | 0 `<div onClick>` or `<span onClick>` violations. All interactive elements use Aura Button, Checkbox, or DataGrid row actions. Hover/focus states provided by Aura. | None needed. |
| Q6 | Error prevention and recovery | 5/5 | Read-only viewer — no destructive actions exist. No confirmations needed. | N/A — read-only app. |
| Q7 | Responsive design | 4/5 | Desktop-only by design per App-Brief ("standard desktop or laptop with a large monitor"). 0 fixed-px sizes. Fusion host handles viewport meta. 3 responsive utility uses. | Consider testing on a 13" laptop to confirm the layout holds at smaller desktop sizes. |
| Q8 | Empty states and first-time experience | 4/5 | EmptyState components in 4 files, empty-state copy in 9 files. Every data panel handles the empty case. | Improve first-time experience: when the app loads with no selected asset, make the "search to get started" guidance more prominent. |
| Q9 | Performance and efficiency | 4/5 | 469 KB gzipped JS bundle. All lists have explicit page size and cursor pagination (max 500 items). Search debounced at 250ms. React Query caching (5 min TTL). Charts limited to 1000 points. Virtualized lists via react-virtual. No code splitting (single entry point). | Consider lazy-loading the PDF viewer (react-pdf) to reduce initial bundle. |
| Q10 | Accessibility (WCAG AA 2.1) | 4/5 | 18 aria-label uses across 12 files. 10 role attributes across 7 files. All images have alt text. Aura components provide built-in focus-visible styles and keyboard support. No `tabIndex={-1}` removals. | Run an axe-core audit in the running app to catch contrast and screen-reader issues that static analysis misses. |

## Result

| Metric | Value |
|---|---|
| **Average score** | **4.0 / 5.0** |
| **Quality level** | **Good — launch with minor fixes** |
| **Gate status** | **PASS** (target: 3.8) |

### Quality level table

| Average | Quality level | Recommendation |
|---|---|---|
| 4.5 - 5.0 | Excellent | Minor improvements over time |
| **3.8 - 4.4** | **Good** | **Address lower-scoring areas** |
| 3.0 - 3.7 | Acceptable | Significant improvements needed before launch |
| 2.0 - 2.9 | Below average | Major redesign recommended |
| 1.0 - 1.9 | Poor | Complete redesign required |

## Fixes applied during this review

- **Text overlap in DataGrid cells:** Added `className="min-w-0 shrink truncate"` to Button components used as custom cell renderers in WorkOrdersPanel and DocumentsPanel. This overrides Aura Button's default `shrink-0` to allow truncation within the DataGrid's constrained column widths.

## Summary

- Average score: 4.0
- Quality level: Good
- Gate: PASS (>= 3.8)
- Lowest scores: Q2 Navigation (3), Q3 Labels (3)
- Recommended focus: search UX clarity and navigation/location cues
