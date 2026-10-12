# Feature Specification: Asset 360

<!--
  This is your app's living product spec. Edit it directly or ask your coding
  agent to collaborate with you on it.
-->

## User Scenarios & Testing

### User Stories
1. As an Operations Analyst, I want to search for a piece of equipment by its tag, name, or description, so that I can quickly find the asset flagged in a shift report or alarm without logging in to multiple systems.
2. As an Operations Analyst, I want to open a single 360° detail page for the selected asset, so that I can see its identity, time series, work orders, and related documents in one unified view.
3. As an Operations Analyst, I want to plot the time series linked to the selected asset over a recent time window, so that I can judge current behavior versus normal without opening the historian tool.
4. As an Operations Analyst, I want to see the recent work orders / activities related to the selected asset, so that I can answer "has anyone already touched this?" without logging in to SAP.
5. As an Operations Analyst, I want to see and preview the documents (P&IDs, manuals, inspection reports) related to the selected asset, so that I do not have to dig through SharePoint to brief the maintenance team.
6. As an Operations Analyst who investigates the same handful of assets across a shift, I want the app to remember the assets I recently opened, so that I can jump back to them in one click.
### Acceptance Scenarios
- Given the analyst is on the home screen, when they type the first few characters of an equipment tag, then they see a ranked list of matching assets showing tag, name, and enough parent/location context to disambiguate.
- Given matching results are displayed, when the analyst selects one, then they are taken to that asset's 360 detail view at a shareable URL with the asset's tag, name, description, and type clearly shown at the top.
- Given the analyst submits a search term that matches no assets, when the search completes, then the app shows a clear empty state explaining no assets matched and how to refine the search.
- Given the analyst is on an asset 360 page, when the page loads, then the time series panel lists every series linked to the asset but plots none by default; the analyst must explicitly pick which series to chart.
- Given the analyst selects one or more time series, when the chart renders, then the default time window ends at the most recent datapoint among the selected series (not at wall-clock "now"), and the chart updates when the analyst changes the selection or the time range.
- Given the analyst is viewing the time series chart, when they trigger the manual refresh control, then the chart re-fetches data for the currently selected series and time range; the chart never auto-polls or streams.
- Given the analyst is viewing an asset with related work orders, when the page loads, then they see a list of recent work orders sorted by recency, each showing identifier, title, status, and date; selecting one reveals its full detail without leaving the 360 page.
- Given the analyst is viewing an asset with related documents, when the page loads, then they see a list of files with name, type, and last-modified date; selecting a PDF or common image opens it inline; any other file type offers a clear download / open-externally action.
- Given the asset has no linked time series, no work orders, or no documents, when the page loads, then each panel shows its own empty state independently and the rest of the page still renders.
- Given a CDF call for one panel fails or is slow while others succeed, when the page loads, then the failing panel shows an inline error with a retry control and the other panels keep working.
- Given the analyst's CDF token does not grant access to a data type (e.g., files), when the page loads, then the affected panel shows a clear "no access" state instead of a generic error.
- Given the analyst has opened at least one asset on this device, when they return to the home screen, then they see a recently-viewed list (up to 10 entries) and can click any entry to return to that asset's 360 view.
- Given an uncaught render error occurs in routing or shared layout, when the error is thrown, then an application-level error boundary shows a clear recovery affordance (reload) instead of a blank screen.
## Requirements
### Functional Requirements
- FR-001: The app MUST provide a single search entry point that accepts a partial or full equipment tag, name, or description and returns a ranked list of matching assets from CDF.
- FR-002: Each search result MUST display the asset's tag/external id, human-readable name, and enough contextual information (e.g., description and parent/location) to disambiguate similarly named assets.
- FR-003: Selecting a search result MUST navigate the analyst to a dedicated 360 detail view for that asset whose URL is shareable (deep-linkable to the same asset).
- FR-004: The 360 detail view MUST show an asset header with tag, name, description, and type, sourced from the asset record in CDF.
- FR-005: The 360 detail view MUST include a time series panel that lists every time series linked to the asset. By default no series is plotted; the analyst explicitly selects which series to chart. When at least one series is selected, the chart's default time window MUST be anchored to the most recent datapoint available for the displayed series (i.e., end of window = latest datapoint timestamp), not to the current wall-clock time, because historian data for these assets may be stale.
- FR-006: Users MUST be able to add or remove plotted series and change the time range shown without leaving the 360 view.
- FR-006a: When no datapoints exist for a selected series at all, the chart MUST show a clear empty state for that series rather than rendering an empty axis or an error.
- FR-006b: The time series chart MUST NOT auto-poll or stream updates. The analyst MUST be able to trigger a manual refresh from the chart panel; the refresh re-fetches data for the currently selected series and time range.
- FR-007: The 360 detail view MUST include a work orders / activities panel that lists items related to the asset, sorted by recency, showing identifier, title/description, status, and a relevant date.
- FR-008: Users MUST be able to view the full detail of a single work order from the panel without leaving the 360 view.
- FR-009: The 360 detail view MUST include a documents panel that lists files related to the asset with file name, type, and last-modified date.
- FR-010: Users MUST be able to preview PDF files and common image formats (PNG, JPEG, GIF, WEBP) inline within the 360 view. All other file types (e.g., Office documents, CAD files, video) MUST present a clear download / open-externally action instead of an inline viewer; no other inline preview formats are in scope for v1.
- FR-011: Each panel (time series, work orders, documents) MUST render its own loading, empty, error, and no-access states independently so a failure or gap in one panel does not block the others.
- FR-012: The app MUST track and display a list of the analyst's recently viewed assets so they can return to a prior asset in one click. The list MUST persist in browser-local storage on the analyst's device (surviving page reloads and browser restarts), MUST be capped at the 10 most recent assets (oldest entries dropped first), and is not synchronized across devices in v1.
- FR-013: The app MUST authenticate the analyst against CDF and only display data the analyst is authorized to see.
- FR-014: All asset, time series, work order, and document data displayed MUST be retrieved live from CDF rather than from a separately maintained copy.
- FR-015: The app MUST be usable on a standard desktop/laptop screen size used in an office or control room (large monitor down to a 13" laptop) without requiring horizontal scrolling.
- FR-016: Beyond per-panel error boundaries, routed application content MUST be wrapped in an application-level error boundary so an uncaught render failure in routing or page layout shows a clear recovery affordance (reload) instead of a blank screen.
## Success Criteria
- SC-001: An Operations Analyst can go from "I have an equipment tag" to "I am looking at that asset's tag, time series, work orders, and documents on one page" in under 30 seconds for a typical asset.
- SC-002: For a typical investigation, the analyst completes the task without opening any other tool (no SAP tab, no historian tab, no SharePoint tab) in at least 80% of sessions.
- SC-003: Median end-to-end investigation time (asset flagged → ready to brief maintenance) drops from 1–2 hours using the legacy multi-tool workflow to under 15 minutes using this app.
- SC-004: On a representative asset's 360 page, all four core panels (header, time series, work orders, documents) render usable content (or a correct empty/error state) within 3 seconds on a standard office network.
- SC-005: At least 90% of analyst sessions in a week include at least one search executed and at least one related document opened, indicating the unified flow is being used end-to-end rather than abandoned partway through.
- SC-006: When one data source is unavailable (e.g., documents), at least 95% of sessions still successfully render the remaining panels, demonstrating that panel-level resilience is working.
## Clarifications
- Default time window for the time series chart is anchored to the most recent datapoint of each selected series (not wall-clock "now"), because historian data for these assets may be stale.
- No time series is plotted by default when an asset has many linked series; the analyst explicitly picks which series to chart.
- The time series chart refreshes only on a manual refresh action; the app does not auto-poll or stream updates.
- The recently-viewed list persists in browser-local storage per device and is capped at the last 10 assets.
- Inline document preview is limited to PDFs and common image formats (PNG, JPEG, GIF, WEBP) in v1; all other types fall back to download / open-externally.


## Assumptions

- No user contact has happened yet; the persona and workflow come from an assumption (see App-Brief.md).
- Users are desk-based on a desktop or laptop with a large monitor; mobile is out of scope for v1.
- The app is read-only: it does not create or edit work orders, assets or files.
- PDFs are fetched from the temporary download URL and drawn inside the page with pdf.js (via `react-pdf`), so the browser never downloads them and no `<iframe>` is needed. This relies on the download host allowing cross-origin reads and on the default content security policy, which allows `https://*.cognitedata.com` for requests. Images use an `<img>`, so `manifest.json` allows `https://*.cognitedata.com` for `img-src`. Not verified: that the download host matches that pattern. "Open in new tab" is the fallback.
- Customer is Cognite Public Industries; the deployment targets org `publicdata`, project `publicdatacdm`.

---

## Data Models & CDF Integration *(mandatory)*

<!--
  Capture how this app integrates with Cognite Data Fusion data models.
  Every Flows app should fill this in.
-->

### Existing views

> **Instruction to the agent:** This app uses the Cognite Core Data Model (`cdf_cdm` space; views such as `CogniteAsset:v1`, `CogniteTimeSeries:v1`, `CogniteActivity:v1`, `CogniteFile:v1`). While populating or changing this spec, you MUST consult the **Cognite Docs MCP** (`cognite-docs`, tool `search_cognite_docs`; configured in `.mcp.json`) for view names, versions, properties and relations. Do not rely on memory, and do not invent views or properties. Where the docs don't confirm a detail, mark it as unverified.

View names and properties below are verified against the Cognite docs via the `cognite-docs` MCP:
[core data model](https://docs.cognite.com/cdf/dm/dm_reference/dm_core_data_model) and
[process industries data model](https://docs.cognite.com/cdf/dm/dm_reference/dm_process_industry_data_model).
The `v1` version is confirmed by docs examples (`cdf_cdm` / `v1`; `cdf_idm` / `v1`). **Checked against `publicdatacdm`** (instance counts per view): `cdf_cdm.CogniteAsset:v1` 1103, `cdf_cdm.CogniteTimeSeries:v1` 363, `cdf_cdm.CogniteActivity:v1` 2850 and `cdf_idm.CogniteMaintenanceOrder:v1` 2850 are populated. The equal Activity and MaintenanceOrder counts suggest every activity is a maintenance order, so `status`, `priority` and `type` should be available through the `cdf_idm` view. The project also has `cdf_infield.Asset:v1` (1103, the same count as `CogniteAsset`). **Not verified:** the counts for `CogniteFile` and `CogniteEquipment` (not seen), and which space holds the instances.

- `cdf_cdm.CogniteAsset:v1`: asset search and hierarchy. Properties: `parent`, `children` (virtual reverse relation), `root`, `path` (use for subtree filtering), `assetClass`, `type`, plus reverse relations `equipment`, `timeSeries`, `activities`, `files`.
- `cdf_cdm.CogniteEquipment:v1`: equipment linked to an asset. Properties: `asset`, `files`, `serialNumber`, `manufacturer`, `equipmentType`, plus reverse relations `timeSeries`, `activities`.
- `cdf_cdm.CogniteTimeSeries:v1`: sensor data for the chart. Properties: `assets`, `equipment`, `type` (`numeric` | `string` | `state`), `isStep`, `unit`, `sourceUnit`, `stateSet`. Datapoints are read through the Time Series datapoints API, not the data modeling API.
- `cdf_cdm.CogniteFile:v1`: manuals and P&IDs. Properties: `assets`, `mimeType`, `directory`, `isUploaded`, `uploadedTime`, `category` (`CogniteFileCategory`). Access needs the `datamodelinstances` ACL.
- `cdf_idm.CogniteMaintenanceOrder:v1`: work orders (process industries data model). Properties: `mainAsset`, `type`, `status`, `priority`, `operations` (reverse relation). Also implements `CogniteActivity` and `CogniteSchedulable`.
- `cdf_idm.CogniteOperation:v1` and `cdf_idm.CogniteNotification:v1`: related work items and notifications. Out of scope for v1 unless needed.
- `cdf_cdm.CogniteActivity:v1`: activities and the fallback for work orders. Properties: `assets`, `equipment`, `timeSeries` (lists of direct relations), plus `name`, `description` (CogniteDescribable), `sourceId` (CogniteSourceable) and `startTime`, `endTime`, `scheduledStartTime`, `scheduledEndTime` (CogniteSchedulable). It has **no** `status`, `priority` or `type`; those belong to `CogniteMaintenanceOrder`.
- Shared properties on the views above (CogniteDescribable): `name`, `description`, `tags`, `aliases`. Source properties (CogniteSourceable): `sourceId`, `sourceContext`, `source`.

### Data access patterns

Verified against the Cognite docs via the `cognite-docs` MCP ([search features](https://docs.cognite.com/cdf/dm/dm_concepts/dm_search), [datapoints](https://docs.cognite.com/api-reference/concepts/20230101/datapoints), [file content](https://docs.cognite.com/api-reference/concepts/20230101/file-content)).

- **Asset search:** use the data modeling search endpoint with `query` text, which is tokenized and case-insensitive; the last token is a prefix match, so search-as-you-type works. Set the search operator to `AND` explicitly: the default is `OR` today and changes to `AND` in November 2026. Searchable properties: `name` and `description`. **Not verified:** whether `aliases` can be searched.
- **Subtree and linked data:** search and aggregation accept a nested filter on `assets.path` for `CogniteActivity`, `CogniteFile` and `CogniteTimeSeries`, which returns items linked to an asset or anything below it. Nested filters on other properties need the Query API.
- **Datapoints:** read through the Time Series datapoints API, identifying a series by `instanceId: { space, externalId }` (the CogniteTimeSeries node id), not through the data modeling API.
- **Related files:** besides `CogniteFile.assets`, the P&ID annotation workflow records tag matches as `CogniteDiagramAnnotation` edges from the file to the asset, so the app lists edges ending at the asset and keeps the start nodes that have data in `CogniteFile`. Edges are not filtered by edge type, because the exact type for `publicdatacdm` is not verified. Files linked to ancestor assets are included.
- **Files:** request a temporary link with `POST /files/downloadlink` using `instanceId`. Links expire after 30 seconds by default, or after 1 hour with `extendedExpiration=true`, so fetch a link when the user opens a file instead of when the list loads.
- **Work orders:** read from the `cdf_idm.CogniteMaintenanceOrder:v1` view, filtered to orders that list the asset in `assets` or have it as `mainAsset`, sorted by start time, else scheduled start, else source creation time. Identifier is `sourceId` (else the external id), title is `name`. **Not verified against `publicdatacdm`:** which of `assets` or `mainAsset` is populated, and the exact meaning of `status` values.
- **Time series chart:** the window ends at the latest datapoint of the chosen series, found with the latest-datapoint request (`retrieveLatest`, which looks before the current time). Data is averaged per time bucket and loaded again only on the manual refresh control; the chart never polls and does not refetch on window focus.
- **Documents:** the list shows `name`, a type label from `mimeType`, and the last-modified date: `sourceUpdatedTime`, else `uploadedTime`, else the node's last update. Only PDF and PNG, JPEG, GIF and WEBP files preview inline.
- **Large lists:** time series, work orders and documents load page by page up to 500 items, then say "Showing the first 500 results." Search shows the 25 best matches.
- **Retries:** failed requests retry only for network errors, timeouts, 429 and 5xx, at most 3 times with exponential backoff and jitter. Other 4xx errors are not retried; 401 and 403 show a "no access" state in the affected panel.
- **Recently viewed:** the last 10 opened assets are stored in the browser's `localStorage` under `asset360.recentAssets` (not synced to the host or across devices).
- **Search consistency:** search is eventually consistent, so new or updated instances can take a few seconds to appear.

### Access control

The user needs `dataModelInstancesAcl:READ` on the instance space(s), `dataModelsAcl:READ` on `cdf_cdm` (and `cdf_idm` if work orders are used), and `dataModelsAcl:READ` on `cdf_extraction_extensions` for properties set by Cognite extractors. Units need `dataModelInstancesAcl:READ` on `cdf_cdm_units`. Time series datapoints need `timeSeriesAcl:READ`; file downloads need `filesAcl:READ`, or `dataModelsAcl:READ` on `cdf_cdm` together with `dataModelInstancesAcl:READ`.

### New views

None planned. The app reads existing data only.

### Spaces

- `cdf_cdm`: core data model definitions (requires `dataModelsAcl:READ`).
- `cdf_idm`: process industries data model definitions (`CogniteMaintenanceOrder`, `CogniteOperation`, `CogniteNotification`). Needed only if work orders carry status and priority.
- `cdf_cdm_units`: unit catalog instances, read for the time-series unit label.
- `cdf_extraction_extensions`: properties written by Cognite extractors.
- Instance space(s) holding the assets, time series, files and activities: TBD, to be found in the project (not yet identified).
