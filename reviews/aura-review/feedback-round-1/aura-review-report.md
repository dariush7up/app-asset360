# Aura Review — /Users/dariush.ubaydi@cognitedata.com/workspace/app-asset360 — round 1

## Headline

| Metric | Value |
| --- | --- |
| Aura coverage | 41.7% (15/36 distinct component types) |
| Could have been Aura | 0% (0/14) |
| Usage-quality findings | 0 |

## Non-compliance findings

| Component | Usages | Could have been | Evidence |
| --- | --- | --- | --- |
| App | 5 | none | Root app composition; renders providers and Asset360 shell, no UI primitive. |
| AppStateProvider | 3 | none | React context provider for host-synced state; no UI. |
| AppServicesProvider | 1 | none | React context provider for injected services; no UI. |
| Asset360 | 2 | none | Page-level composition of AssetSearch/AssetPage/ViewInventory (already uses Aura Collapsible); no matching Aura primitive. |
| Section | 4 | none | Wrapper that switches between Aura Skeleton, Alert, EmptyState and children; it composes Aura, no single Aura component matches. |
| AssetPage | 1 | none | Page composition (Card, Breadcrumb, Tabs, Badge, Button from Aura); no matching Aura primitive. |
| AssetSearch | 1 | none | Search view already built on Aura Command/Skeleton/EmptyState; no matching Aura primitive. |
| ViewInventory | 2 | none | Feature view of data-model view inventory using Aura Alert/Badge/Skeleton; no matching Aura primitive. |
| TimeSeriesSection | 1 | none | Feature section composing Aura Card/Button/Chart; no matching Aura primitive. |
| FilesSection | 1 | none | Feature section composing Aura DataGrid/Button/Badge; no matching Aura primitive. |
| ActivitiesSection | 1 | none | Feature section composing Aura DataGrid/Badge; no matching Aura primitive. |
| ChildAssetsSection | 1 | none | Feature section composing Aura DataGrid/Button; no matching Aura primitive. |
| FileViewer | 1 | none | Local function rendering a raw <img> or <iframe> for file preview; DESIGN.md and checked docs have no Aura file/image viewer component (only an iframe title note). |
| ViewList | 3 | none | Local function rendering a titled <section> with <ul> of rows plus Aura Badge; DESIGN.md has no list primitive whose Use when matches. |

## Usage-quality findings

No usage-quality findings.

## Excluded from judgment

Third-party components — not a design-system concern.

- QueryClientProvider (5 usages, from `@tanstack/react-query`)
- CogniteSdkProvider (1 usages, from `@cognite/app-sdk/react`)
- LineChart (1 usages, from `recharts`)
- CartesianGrid (1 usages, from `recharts`)
- XAxis (1 usages, from `recharts`)
- YAxis (1 usages, from `recharts`)
- Line (1 usages, from `recharts`)
