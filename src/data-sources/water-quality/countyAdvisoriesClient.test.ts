import { describe, expect, it } from "vitest";
import {
  SAN_DIEGO_COUNTY_BEACH_INFO_URL,
  selectPrimaryCountyEvent,
  summarizeCountyAdvisoryStatus,
} from "./countyAdvisoriesClient";

describe("county advisory status selection", () => {
  it("prefers higher-severity county events over newer lower-severity ones", () => {
    const primaryEvent = selectPrimaryCountyEvent([
      {
        source: "County",
        siteId: "site-open",
        eventId: "evt-open",
        status: "open",
        beachName: "La Jolla Shores",
        issuedAt: "2026-06-18T09:00:00Z",
        raw: {},
      },
      {
        source: "County",
        siteId: "site-closure",
        eventId: "evt-closure",
        status: "closure",
        beachName: "La Jolla Shores",
        issuedAt: "2026-06-17T09:00:00Z",
        raw: {},
      },
    ]);

    expect(primaryEvent?.eventId).toBe("evt-closure");
  });

  it("summarizes the primary county event into planner-facing advisory status", () => {
    const status = summarizeCountyAdvisoryStatus([
      {
        source: "County",
        siteId: "site-warning",
        eventId: "evt-warning",
        status: "warning",
        beachName: "Mission Beach",
        stationId: "MB-001",
        issuedAt: "2026-06-18T12:00:00Z",
        publicNotification: "Bacterial levels remain elevated near the storm drain.",
        raw: {},
      },
    ]);

    expect(status).toEqual(
      expect.objectContaining({
        status: "warning",
        advisoryUrl: SAN_DIEGO_COUNTY_BEACH_INFO_URL,
        beachName: "Mission Beach",
        countyEventId: "evt-warning",
        stationId: "MB-001",
      }),
    );
  });
});
