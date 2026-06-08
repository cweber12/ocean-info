# Location Model

The initial app uses a curated location catalog instead of arbitrary geocoding.

## Scope

The initial coastline scope is San Diego through Oceanside.

## Location Fields

Each location should include:

- stable id
- display name
- city or area
- latitude and longitude
- supported activity tags
- optional station hints for tide, buoy, weather, and water quality sources

## Why Curated Locations

Curated locations make source mapping reliable. Many ocean APIs are station-based, not beach-name based. A curated model lets the app map a user-facing place like "La Jolla Shores" to the best available stations per data type.

## Future Expansion

Arbitrary coordinates can be added later by resolving nearest station candidates at runtime or through a backend service. Do not block the initial app on that complexity.
