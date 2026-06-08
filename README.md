# Ocean Info

Ocean Info is a static web app for viewing Southern California ocean conditions by activity, location, and date.

Initial activity modules:

- Dive
- Surf
- Tidepools
- Beach day
- Sail
- SUP / kayak

Initial coastline scope:

- San Diego through Oceanside

## Architecture

This project starts as a Vite + React + TypeScript static client. It does not require a hosted backend or database.

The codebase is organized around three separations:

- activity modules decide what data matters for an activity
- data-source modules fetch and normalize external APIs
- domain modules define shared contracts between the two

See [docs/architecture.md](docs/architecture.md) for the full structure.

## API Key Policy

Private API keys must not be shipped in this app. Browser-visible `VITE_*` values are public by design.

Allowed in the initial static app:

- no-key public APIs
- browser-safe public tokens
- user-supplied credentials stored locally on the user's device

Not allowed until a backend exists:

- private weather or surf API keys
- server-only credentials
- writeable user sightings or shared user data

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Equivalent commands can be run with pnpm, yarn, or bun if preferred.

## Key Docs

- [Architecture](docs/architecture.md)
- [API source matrix](docs/api-source-matrix.md)
- [Location model](docs/location-model.md)
- [Static client decision](docs/decisions/0001-static-client-only.md)
- [Module boundary decision](docs/decisions/0002-module-boundaries.md)
