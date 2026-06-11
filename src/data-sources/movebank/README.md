# Movebank Data Source

This adapter fetches normalized animal tracking summaries from a first-party Cloudflare Worker endpoint.

Why:

- Movebank credentials are private and must not be exposed in browser code.
- The Worker performs validation and allowlist enforcement.
- The frontend receives only normalized track payloads.

Contract:

- `GET {VITE_MOVEBANK_PROXY_BASE_URL}/tracks`
- Query params: `centerLat`, `centerLng`, `radiusKm`, `dateEnd`, `daysBack`
- Response: normalized `AnimalTrackingReport` payload
