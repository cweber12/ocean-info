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
npx wrangler secret put OPEN_WEATHER_KEY
```

4. Add Worker variables in `wrangler.toml`:

- `MOVEBANK_BASE_URL` (default `https://www.movebank.org`)
- `MOVEBANK_STUDY_IDS` (comma-separated allowlist)
- `MAX_DAYS_BACK` (default 30)
- `MAX_RADIUS_KM` (default 100)

5. Map route to your app domain, for example:

- `https://your-domain.com/api/movebank/*`
- `https://your-domain.com/api/weather/*`

## Local development

Run the Worker locally from `cloudflare/movebank-worker` with:

```bash
npm run dev
```

The local dev script is pinned to `http://127.0.0.1:8787` because the Vite app
proxy forwards `/api/movebank/*` and `/api/weather/*` to that exact origin. If
the Worker is allowed to auto-select a different port, the browser requests will
hang instead of returning data.

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

### GET /api/weather/fallback

Query params:

- `latitude` number
- `longitude` number
- `date` ISO date (`YYYY-MM-DD`)

Notes:

- date window is limited to today through five days ahead
- this endpoint is only intended to fill NOAA/NWS weather gaps
- the Worker uses OpenWeather's free 5 day / 3 hour forecast endpoint and normalizes those periods into the app response shape

Response:

```json
{
  "sourceName": "OpenWeather",
  "stationName": "OpenWeather 32.88,-117.26",
  "summary": {
    "shortForecast": "broken clouds",
    "temperatureFahrenheit": 70,
    "windDirection": "NW",
    "windSpeedMph": 11
  },
  "hourlyForecast": [
    {
      "at": "2026-06-12T10:00:00-07:00",
      "airTemperatureFahrenheit": 70,
      "precipitationChancePercent": 0,
      "relativeHumidityPercent": 66,
      "shortForecast": "broken clouds",
      "sourceName": "OpenWeather",
      "windDirection": "NW",
      "windDirectionDegrees": 315,
      "windSpeedMph": 11
    }
  ],
  "windObservation": {
    "at": "2026-06-12T10:00:00-07:00",
    "direction": "NW",
    "directionDegrees": 315,
    "speedKnots": 9.56,
    "sourceName": "OpenWeather",
    "stationName": "OpenWeather 32.88,-117.26"
  }
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
