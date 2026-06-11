# API Source Matrix

This document tracks candidate data sources before implementation.

| Category | Candidate Source | Static Client Fit | Notes |
| --- | --- | --- | --- |
| Weather | NOAA / National Weather Service | Good | Implemented with `api.weather.gov/points/{lat},{lon}` and the returned hourly forecast URL for selected-location/date summaries and wind charts. Browser requests do not include private keys. |
| Tide | NOAA CO-OPS Data API | Good | Implemented for tide predictions with `product=predictions`, `datum=MLLW`, `time_zone=lst_ldt`, English units, high/low rows for tables, and hourly rows for charts. Locations map to vetted NOAA tide-prediction stations, with North County locations currently mapped to La Jolla/Scripps because NOAA does not list Carlsbad/Oceanside tide-prediction stations in the San Diego-to-Oceanside range. |
| Buoys / marine conditions | NDBC | Good | Implemented as best-effort latest-observation enrichment from public realtime station text files for curated exposed-coast buoy hints. Used for wave height, period, and direction when available for today's plan. |
| Water quality | Local county / beach advisories | Mixed | Source format may vary by jurisdiction. Prefer public JSON/RSS if available. |
| Water temperature | NOAA CO-OPS / NDBC | Good | Implemented as best-effort NOAA CO-OPS `water_temperature` observations against the curated tide station. Some subordinate stations may not expose this product. |
| Wind observations | NOAA CO-OPS | Good | Implemented as best-effort NOAA CO-OPS `wind` observations against the curated tide station, with NWS hourly wind forecast as the fallback. |
| Currents | NOAA CO-OPS | Mixed | Client support is scaffolded for `currents` with a curated `currentStationId`, but current-station mappings still need validation before broad display. Panels show an unavailable state when no current station is mapped. |
| Surf | Public/free surf sources | Mixed | Many high-quality surf APIs require private keys or prohibit browser use. |
| Marine sightings | iNaturalist API | Good | Implemented with public `api.inaturalist.org/v1/observations/species_counts` for grouped taxa and `api.inaturalist.org/v1/observations` for paged sighting details. Requests use public observed-date, radius, coordinate, photo, quality-grade, and name-search parameters with no private key. Defaults are 5 km and the past 7 observed days, with `research` and `needs_id` observations included and research-grade rows prioritized in display. Results are normalized and filtered to marine-ish animal taxa before rendering. Keep requests comfortably under iNaturalist's published throttle guidance of 100 requests/minute max, preferably 60 requests/minute or less and under 10,000/day. |
| Migration | NOAA / research org summaries | Mixed | Often seasonal or static, not always API-backed. |
| Animal trackers | Organization-specific trackers | Mixed | Terms, CORS, and API stability need source-by-source review. |

## Acceptance Rules

A data source can be added to the static client when:

- it does not require a private API key
- the browser can call it directly or via permitted public files
- its terms allow this use
- responses can be validated and normalized

If any rule fails, document the source as backend-only.
