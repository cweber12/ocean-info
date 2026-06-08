# 0001: Static Client Only

## Status

Accepted

## Context

The project should not initially host a server or database. It should not store private API keys in hosted infrastructure.

## Decision

Build the first version as a Vite + React + TypeScript static client.

The client may call public browser-accessible APIs directly. It may not ship private API keys.

## Consequences

Positive:

- simple deployment
- no backend operations
- clear constraint against accidental secret exposure
- fast local development

Tradeoffs:

- no private-key API access
- no shared user-generated data
- no server-side caching or rate limiting
- CORS limitations may exclude some sources

## Revisit When

Revisit this decision when private APIs, auth, persistence, writeable sightings, or server-side caching become core product requirements.
