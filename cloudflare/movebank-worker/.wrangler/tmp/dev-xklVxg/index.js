var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var allowedQueryKeys = /* @__PURE__ */ new Set([
  "centerLat",
  "centerLng",
  "dateEnd",
  "daysBack",
  "radiusKm"
]);
var weatherQueryKeys = /* @__PURE__ */ new Set(["date", "latitude", "longitude"]);
var corsHeaders = {
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-origin": "*"
};
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }
    const url = new URL(request.url);
    if (url.pathname.endsWith("/tracks")) {
      return handleTracksRequest(url, request, env);
    }
    if (url.pathname.endsWith("/fallback")) {
      return handleWeatherFallbackRequest(url, env);
    }
    return json({ error: "Not found" }, 404);
  }
};
async function handleTracksRequest(url, request, env) {
  let query;
  try {
    query = parseAndValidateQuery(url, env);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Invalid request"
      },
      400
    );
  }
  const allowedStudyIds = parseAllowlistedStudyIds(env.MOVEBANK_STUDY_IDS);
  if (allowedStudyIds.length === 0) {
    return json(
      {
        error: "No allowlisted study IDs configured"
      },
      503
    );
  }
  try {
    const tracks = await fetchTracks({
      allowedStudyIds,
      credentials: {
        password: env.MOVEBANK_PASSWORD,
        username: env.MOVEBANK_USERNAME
      },
      query,
      request,
      upstreamBaseUrl: env.MOVEBANK_BASE_URL || "https://www.movebank.org"
    });
    const payload = {
      sourceName: "Movebank",
      totalTracks: tracks.length,
      tracks
    };
    return json(payload, 200, {
      "cache-control": "public, max-age=120, stale-while-revalidate=300"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Movebank fetch failed", message);
    return json({ error: `Movebank upstream request failed: ${message}` }, 502);
  }
}
__name(handleTracksRequest, "handleTracksRequest");
async function handleWeatherFallbackRequest(url, env) {
  if (!env.OPEN_WEATHER_KEY) {
    return json({ error: "OPEN_WEATHER_KEY is not configured" }, 503);
  }
  let query;
  try {
    query = parseAndValidateWeatherQuery(url);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Invalid request"
      },
      400
    );
  }
  if (!isWithinOpenWeatherWindow(query.date)) {
    return json(
      {
        error: "date must be from yesterday through 5 days ahead"
      },
      400
    );
  }
  try {
    const fallback = await fetchOpenWeatherFallback(query, env.OPEN_WEATHER_KEY);
    return json(fallback, 200, {
      "cache-control": "public, max-age=300, stale-while-revalidate=600"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("OpenWeather fetch failed", message);
    return json({ error: `OpenWeather upstream request failed: ${message}` }, 502);
  }
}
__name(handleWeatherFallbackRequest, "handleWeatherFallbackRequest");
async function fetchOpenWeatherFallback(query, apiKey) {
  const upstreamUrl = new URL("https://api.openweathermap.org/data/3.0/onecall");
  upstreamUrl.searchParams.set("lat", query.latitude.toFixed(4));
  upstreamUrl.searchParams.set("lon", query.longitude.toFixed(4));
  upstreamUrl.searchParams.set("appid", apiKey);
  upstreamUrl.searchParams.set("units", "imperial");
  upstreamUrl.searchParams.set("exclude", "minutely,daily,alerts");
  const response = await fetch(upstreamUrl);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream status ${response.status}: ${body.slice(0, 200)}`);
  }
  const payload = await response.json();
  const timezoneOffsetSeconds = payload.timezone_offset ?? 0;
  const stationName = `OpenWeather ${query.latitude.toFixed(2)},${query.longitude.toFixed(2)}`;
  const hourlyForecast = (payload.hourly ?? []).map((hour) => toFallbackPoint(hour, timezoneOffsetSeconds)).filter((item) => Boolean(item)).filter((point) => point.at.slice(0, 10) === query.date);
  const summaryPoint = getSummaryPoint(hourlyForecast, query.date);
  return {
    sourceName: "OpenWeather",
    stationName,
    hourlyForecast,
    summary: summaryPoint ? {
      shortForecast: summaryPoint.shortForecast,
      temperatureFahrenheit: summaryPoint.airTemperatureFahrenheit,
      windDirection: summaryPoint.windDirection,
      windSpeedMph: summaryPoint.windSpeedMph
    } : void 0,
    windObservation: summaryPoint ? {
      at: summaryPoint.at,
      direction: summaryPoint.windDirection,
      directionDegrees: summaryPoint.windDirectionDegrees,
      gustKnots: summaryPoint.windGustMph !== void 0 ? mphToKnots(summaryPoint.windGustMph) : void 0,
      sourceName: "OpenWeather",
      speedKnots: summaryPoint.windSpeedMph !== void 0 ? mphToKnots(summaryPoint.windSpeedMph) : void 0,
      stationName
    } : void 0
  };
}
__name(fetchOpenWeatherFallback, "fetchOpenWeatherFallback");
function toFallbackPoint(hour, timezoneOffsetSeconds) {
  if (typeof hour.dt !== "number") {
    return void 0;
  }
  const at = toIsoWithOffset(hour.dt, timezoneOffsetSeconds);
  const directionDegrees = asNumber(hour.wind_deg);
  return {
    at,
    airTemperatureFahrenheit: asNumber(hour.temp),
    precipitationChancePercent: typeof hour.pop === "number" ? Math.round(hour.pop * 100) : void 0,
    relativeHumidityPercent: asNumber(hour.humidity),
    shortForecast: asString(hour.weather?.[0]?.description),
    sourceName: "OpenWeather",
    windDirection: toCardinal(directionDegrees),
    windDirectionDegrees: directionDegrees,
    windGustMph: asNumber(hour.wind_gust),
    windSpeedMph: asNumber(hour.wind_speed)
  };
}
__name(toFallbackPoint, "toFallbackPoint");
async function fetchTracks({
  allowedStudyIds,
  credentials,
  query,
  request,
  upstreamBaseUrl
}) {
  const startDate = getStartDate(query.dateEnd, query.daysBack);
  const bbox = makeBbox(query.centerLat, query.centerLng, query.radiusKm);
  const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  const tracks = [];
  for (const studyId of allowedStudyIds) {
    const upstreamUrl = new URL("/movebank/service/direct-read", upstreamBaseUrl);
    upstreamUrl.searchParams.set("entity_type", "event");
    upstreamUrl.searchParams.set("study_id", studyId);
    upstreamUrl.searchParams.set("attributes", "individual_local_identifier,timestamp,location_lat,location_long,taxon_canonical_name");
    upstreamUrl.searchParams.set("timestamp_start", `${startDate} 00:00:00.000`);
    upstreamUrl.searchParams.set("timestamp_end", `${query.dateEnd} 23:59:59.000`);
    const response = await fetch(upstreamUrl, {
      headers: {
        authorization: authHeader,
        "user-agent": request.headers.get("user-agent") ?? "TideGuideMovebankWorker/1.0"
      }
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upstream status ${response.status}: ${body.slice(0, 200)}`);
    }
    const csv = await response.text();
    const events = parseCsvEvents(csv);
    const bboxed = filterByBbox(events, bbox);
    const normalizedTracks = normalizeEventsToTracks(bboxed, studyId);
    tracks.push(...normalizedTracks);
  }
  return tracks.sort((a, b) => {
    const aTime = a.latestPoint?.timestamp ?? "";
    const bTime = b.latestPoint?.timestamp ?? "";
    return bTime.localeCompare(aTime);
  }).slice(0, 200);
}
__name(fetchTracks, "fetchTracks");
function parseCsvEvents(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const events = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].replace(/^"|"$/g, "").trim();
    }
    events.push(row);
  }
  return events;
}
__name(parseCsvEvents, "parseCsvEvents");
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
__name(splitCsvLine, "splitCsvLine");
function filterByBbox(events, bbox) {
  return events.filter((event) => {
    const lat = Number(event["location_lat"] ?? event["location-lat"]);
    const lng = Number(event["location_long"] ?? event["location-long"]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
  });
}
__name(filterByBbox, "filterByBbox");
function normalizeEventsToTracks(events, studyId) {
  const byIndividual = /* @__PURE__ */ new Map();
  for (const event of events) {
    const individualId = event["individual_local_identifier"] ?? event["individual-local-identifier"] ?? "";
    const timestamp = event["timestamp"] ?? "";
    const latitude = asNumber(event["location_lat"] ?? event["location-lat"]);
    const longitude = asNumber(event["location_long"] ?? event["location-long"]);
    const species = event["taxon_canonical_name"] ?? event["taxon-canonical-name"] ?? void 0;
    if (!individualId || !timestamp) continue;
    const trackId = `${studyId}:${individualId}`;
    const existing = byIndividual.get(trackId);
    const current = existing ?? {
      id: trackId,
      individualId,
      individualName: individualId,
      pointCount: 0,
      speciesName: species || void 0,
      studyId
    };
    current.pointCount += 1;
    if (latitude !== void 0 && longitude !== void 0 && (!current.latestPoint || timestamp > current.latestPoint.timestamp)) {
      current.latestPoint = {
        point: { latitude, longitude },
        timestamp
      };
    }
    byIndividual.set(trackId, current);
  }
  return Array.from(byIndividual.values());
}
__name(normalizeEventsToTracks, "normalizeEventsToTracks");
function parseAndValidateQuery(url, env) {
  const params = url.searchParams;
  const rawSearch = url.search.replace(/^\?/, "");
  for (const pair of rawSearch.split("&")) {
    const key = pair.split("=")[0];
    if (key && !allowedQueryKeys.has(decodeURIComponent(key))) {
      throw new Error(`Unknown query parameter: ${decodeURIComponent(key)}`);
    }
  }
  const centerLat = Number(params.get("centerLat"));
  const centerLng = Number(params.get("centerLng"));
  const radiusKm = Number(params.get("radiusKm"));
  const daysBack = Number(params.get("daysBack"));
  const dateEnd = params.get("dateEnd") ?? "";
  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90) {
    throw new Error("centerLat must be a valid latitude");
  }
  if (!Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) {
    throw new Error("centerLng must be a valid longitude");
  }
  const maxRadiusKm = Number(env.MAX_RADIUS_KM || "100");
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > maxRadiusKm) {
    throw new Error(`radiusKm must be between 0 and ${maxRadiusKm}`);
  }
  const maxDaysBack = Number(env.MAX_DAYS_BACK || "30");
  if (!Number.isInteger(daysBack) || daysBack < 1 || daysBack > maxDaysBack) {
    throw new Error(`daysBack must be between 1 and ${maxDaysBack}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateEnd)) {
    throw new Error("dateEnd must be in YYYY-MM-DD format");
  }
  return {
    centerLat,
    centerLng,
    dateEnd,
    daysBack,
    radiusKm
  };
}
__name(parseAndValidateQuery, "parseAndValidateQuery");
function parseAndValidateWeatherQuery(url) {
  const params = url.searchParams;
  const rawSearch = url.search.replace(/^\?/, "");
  for (const pair of rawSearch.split("&")) {
    const key = pair.split("=")[0];
    if (key && !weatherQueryKeys.has(decodeURIComponent(key))) {
      throw new Error(`Unknown query parameter: ${decodeURIComponent(key)}`);
    }
  }
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  const date = params.get("date") ?? "";
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("latitude must be a valid latitude");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("longitude must be a valid longitude");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  return {
    date,
    latitude,
    longitude
  };
}
__name(parseAndValidateWeatherQuery, "parseAndValidateWeatherQuery");
function parseAllowlistedStudyIds(raw) {
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}
__name(parseAllowlistedStudyIds, "parseAllowlistedStudyIds");
function makeBbox(centerLat, centerLng, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos(centerLat * Math.PI / 180), 0.2));
  return {
    minLat: clamp(centerLat - latDelta, -90, 90),
    maxLat: clamp(centerLat + latDelta, -90, 90),
    minLng: clamp(centerLng - lngDelta, -180, 180),
    maxLng: clamp(centerLng + lngDelta, -180, 180)
  };
}
__name(makeBbox, "makeBbox");
function getStartDate(dateEndIso, daysBack) {
  const endDate = /* @__PURE__ */ new Date(`${dateEndIso}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - daysBack);
  const yyyy = String(endDate.getUTCFullYear());
  const mm = String(endDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(endDate.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
__name(getStartDate, "getStartDate");
function isWithinOpenWeatherWindow(date) {
  const target = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
  const today = /* @__PURE__ */ new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const min = new Date(base);
  min.setUTCDate(min.getUTCDate() - 1);
  const max = new Date(base);
  max.setUTCDate(max.getUTCDate() + 5);
  return target >= min && target <= max;
}
__name(isWithinOpenWeatherWindow, "isWithinOpenWeatherWindow");
function toIsoWithOffset(unixSeconds, timezoneOffsetSeconds) {
  const utcMillis = unixSeconds * 1e3;
  const localMillis = utcMillis + timezoneOffsetSeconds * 1e3;
  const isoLocal = new Date(localMillis).toISOString().slice(0, 19);
  const sign = timezoneOffsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(timezoneOffsetSeconds);
  const hours = String(Math.floor(abs / 3600)).padStart(2, "0");
  const minutes = String(Math.floor(abs % 3600 / 60)).padStart(2, "0");
  return `${isoLocal}${sign}${hours}:${minutes}`;
}
__name(toIsoWithOffset, "toIsoWithOffset");
function toCardinal(directionDegrees) {
  if (directionDegrees === void 0) {
    return void 0;
  }
  const normalized = (directionDegrees % 360 + 360) % 360;
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalized / 45) % labels.length;
  return labels[index];
}
__name(toCardinal, "toCardinal");
function mphToKnots(speedMph) {
  return Number((speedMph * 0.868976).toFixed(2));
}
__name(mphToKnots, "mphToKnots");
function getSummaryPoint(points, date) {
  if (points.length === 0) {
    return void 0;
  }
  const now = /* @__PURE__ */ new Date();
  if (date !== now.toISOString().slice(0, 10)) {
    return points[0];
  }
  return points.find((point) => new Date(point.at) >= now) ?? points[0];
}
__name(getSummaryPoint, "getSummaryPoint");
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
__name(clamp, "clamp");
function asString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : void 0;
}
__name(asString, "asString");
function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  return void 0;
}
__name(asNumber, "asNumber");
function json(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
      ...extraHeaders
    }
  });
}
__name(json, "json");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-I3z5OO/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-I3z5OO/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
