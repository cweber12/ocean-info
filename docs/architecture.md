# Architecture

## Recommendation

Use Vite + React + TypeScript as a static client application.

This matches the current constraints:

- no hosted server
- no hosted database
- no private API keys in deployed code
- modular ocean activities
- isolated API adapters and display modules

## Directory Structure

```txt
src/
  app/
  activities/
    beach-day/
    dive/
    sail/
    sup-kayak/
    surf/
    tidepools/
  data-sources/
    marine-life/
    ndbc/
    noaa/
    shared/
    water-quality/
  domain/
    location/
    marine/
    tide/
    water/
    waves/
    weather/
  locations/
  shared/
    components/
    config/
    utils/
```

## Data Flow

```txt
location/date filters
  -> activity module
  -> normalized domain data request
  -> data-source adapter
  -> public external API
  -> Zod validation
  -> normalized domain model
  -> activity display
```

## Module Responsibilities

Activity modules:

- expose an activity definition
- define relevant condition groups
- compose display sections
- score or summarize conditions for the activity

Data-source modules:

- own endpoint URLs
- own raw response schemas
- validate external responses
- map raw payloads into domain types

Domain modules:

- define shared normalized types
- avoid source-specific fields unless clearly marked
- stay independent of React

Location modules:

- define curated locations from San Diego to Oceanside
- provide coordinates, tags, and station hints
- avoid runtime geocoding for core coastal locations

## Future Backend Compatibility

When private APIs become necessary, preserve the same frontend contracts and replace direct source adapters with first-party API adapters.

Example:

```txt
src/data-sources/noaa/direct-client.ts
src/data-sources/noaa/backend-client.ts
```

The activity modules should not change when this swap happens.
