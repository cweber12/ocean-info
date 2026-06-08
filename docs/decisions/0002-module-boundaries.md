# 0002: Activity and Data-Source Boundaries

## Status

Accepted

## Context

The app combines many source types: weather, tide, surf, water quality, water temperature, marine sightings, migrations, trackers, and more.

Without strict boundaries, activity screens can become tightly coupled to source-specific API payloads.

## Decision

Separate activity modules from data-source modules.

Activity modules consume normalized domain data. Data-source modules fetch and map raw external API payloads into those domain contracts.

## Consequences

Positive:

- easier to add new activities
- easier to replace or remove data providers
- testable source adapters
- future backend proxy can preserve frontend contracts

Tradeoffs:

- more initial files
- mapping code must be maintained
- source-specific data can be lost if the domain model is too narrow
