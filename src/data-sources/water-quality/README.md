# Water Quality Data Sources

Use this module for county and agency beach advisory feeds.

Because water-quality sources vary by jurisdiction, document each source in `docs/api-source-matrix.md` before implementation.

## Current County Advisory Boundary

San Diego County advisories are modeled as the authoritative official-status layer, separate from WQP samples and SCCOOS observations.

The county adapter scaffold lives in `countyAdvisoriesClient.ts`. It currently preserves the source boundary and fallback behavior, but live screen-service fetching is still blocked on reproducing the public OutSystems request/session shape used by `sdbeachinfo`.
