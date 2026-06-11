# Movebank Through Cloudflare Worker

This project uses a Cloudflare Worker as a credential boundary for Movebank.

## Why this exists

- Movebank credentials must not be exposed to browser clients.
- The app remains a static frontend and calls a first-party edge endpoint.
- The Worker enforces query limits, study allowlists, and response normalization.

## Frontend configuration

Set these in local `.env` (never put private credentials here):

```env
VITE_ENABLE_MOVEBANK_TRACKING=true
VITE_MOVEBANK_PROXY_BASE_URL=/api/movebank
VITE_MOVEBANK_DAYS_BACK=7
VITE_MOVEBANK_RADIUS_KM=25
```

## Worker setup

1. Install Wrangler globally or use `npx`.
2. Create and deploy from `cloudflare/movebank-worker`.
3. Add Worker secrets:

```bash
npx wrangler secret put MOVEBANK_USERNAME
npx wrangler secret put MOVEBANK_PASSWORD
```

4. Add Worker variables in `wrangler.toml`:

- `MOVEBANK_BASE_URL` (default `https://www.movebank.org`)
- `MOVEBANK_STUDY_IDS` (comma-separated allowlist)
- `MAX_DAYS_BACK` (default 30)
- `MAX_RADIUS_KM` (default 100)

5. Map route to your app domain, for example:

- `https://your-domain.com/api/movebank/*`

## Endpoint contract expected by frontend

### GET /api/movebank/tracks

Query params:

- `centerLat` number
- `centerLng` number
- `radiusKm` number
- `dateEnd` ISO date (`YYYY-MM-DD`)
- `daysBack` integer

Response:

```json
{
  "sourceName": "Movebank",
  "totalTracks": 2,
  "tracks": [
    {
      "id": "study-123:tag-abc",
      "individualId": "tag-abc",
      "individualName": "Blue Shark 7",
      "latestPoint": {
        "point": { "latitude": 32.89, "longitude": -117.32 },
        "timestamp": "2026-06-10T13:14:00Z"
      },
      "pointCount": 48,
      "speciesName": "Prionace glauca",
      "studyId": "123",
      "studyName": "Southern California Pelagic Movement"
    }
  ]
}
```

## Security requirements

- Reject unknown query parameters.
- Reject requests outside max bounds/date windows.
- Restrict study IDs to `MOVEBANK_STUDY_IDS`.
- Return normalized fields only, never raw credentialed payloads.
- Add per-IP rate limiting at Cloudflare.

## Notes

The current Worker scaffold in `cloudflare/movebank-worker` is intentionally minimal and focused on boundary enforcement. Depending on your Movebank account and study access, you may need to tune upstream query parameters in the Worker fetch function.
