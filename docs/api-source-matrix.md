# API Source Matrix

This document tracks candidate data sources before implementation.

| Category | Candidate Source | Static Client Fit | Notes |
| --- | --- | --- | --- |
| Weather | NOAA / National Weather Service | Good | Public, no private key expected for many endpoints. Verify CORS per endpoint. |
| Tide | NOAA CO-OPS | Good | Public tide and water level data. Map locations to stations. |
| Buoys / marine conditions | NDBC | Good | Public buoy observations and forecasts. |
| Water quality | Local county / beach advisories | Mixed | Source format may vary by jurisdiction. Prefer public JSON/RSS if available. |
| Water temperature | NOAA CO-OPS / NDBC | Good | Depends on station coverage near selected location. |
| Surf | Public/free surf sources | Mixed | Many high-quality surf APIs require private keys or prohibit browser use. |
| Marine sightings | Public science/community sources | Mixed | Usually fragmented by species and organization. No user submissions without backend. |
| Migration | NOAA / research org summaries | Mixed | Often seasonal or static, not always API-backed. |
| Animal trackers | Organization-specific trackers | Mixed | Terms, CORS, and API stability need source-by-source review. |

## Acceptance Rules

A data source can be added to the static client when:

- it does not require a private API key
- the browser can call it directly or via permitted public files
- its terms allow this use
- responses can be validated and normalized

If any rule fails, document the source as backend-only.
