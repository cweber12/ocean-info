# AGENTS.md

## Project Intent

Ocean Info is a static React application for comparing Southern California ocean conditions by activity, location, and date. The initial coastline scope is San Diego through Oceanside.

## Current Architecture Decision

- Use Vite, React, and TypeScript for a static client application.
- Do not add a hosted backend, hosted database, API routes, server actions, or server-only secrets during the initial build.
- Use only browser-accessible public APIs or user-supplied local credentials.
- Keep all private-key API integrations out of the client until a backend exists.

## Module Boundaries

- `src/activities/*` owns activity-specific scoring, labels, and display composition.
- `src/data-sources/*` owns external API clients, raw response schemas, and source-specific mapping.
- `src/domain/*` owns normalized types shared across activities and sources.
- `src/locations/*` owns curated coast locations and station mappings.
- `src/shared/*` owns cross-cutting UI, config, and utilities.

Activity modules must not call `fetch` directly. They consume normalized domain data through provider interfaces.

Data-source modules must not render React UI. They fetch, validate, and normalize data.

## Future Backend Path

If private API keys, persistence, auth, writeable sightings, or cross-user features become necessary, add either:

- a separate lightweight API service, or
- a Next.js migration if the backend should be tightly coupled to the app.

Preserve the domain contracts so the frontend can switch from direct public APIs to first-party endpoints without rewriting activity modules.

## Engineering Practices

- Prefer strict TypeScript contracts and Zod validation at API boundaries.
- Keep modules small and independently replaceable.
- Document new data sources in `docs/api-source-matrix.md` before wiring them into an activity.
- Do not commit secrets. Do not put private keys in `VITE_*` variables.
