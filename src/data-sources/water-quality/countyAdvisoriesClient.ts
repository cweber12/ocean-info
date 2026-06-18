import type { CoastalLocation } from "../../domain/location/types";
import type {
  CountyWaterQualityEvent,
  WaterDataError,
  WaterQualityAdvisoryStatus,
} from "../../domain/water/types";

export const SAN_DIEGO_COUNTY_BEACH_INFO_URL =
  "https://cosdapps.sandiegocounty.gov/sdbeachinfo/";

const COUNTY_SOURCE_NAME = "San Diego County beach advisories";

const COUNTY_STATUS_PRIORITY = {
  closure: 4,
  warning: 3,
  advisory: 2,
  open: 1,
} as const;

export interface CountyAdvisoryReport {
  advisoryStatus: WaterQualityAdvisoryStatus;
  countyEvents: CountyWaterQualityEvent[];
  errors: WaterDataError[];
}

export async function fetchCountyAdvisoryReport({
  location,
}: {
  location: CoastalLocation;
}): Promise<CountyAdvisoryReport> {
  const countyAdvisoryStationId = location.stationHints?.countyAdvisoryStationId;

  if (!countyAdvisoryStationId) {
    return {
      advisoryStatus: {
        status: "not_integrated",
        sourceName: COUNTY_SOURCE_NAME,
        message: "No curated county advisory mapping is configured for this location yet.",
        advisoryUrl: SAN_DIEGO_COUNTY_BEACH_INFO_URL,
      },
      countyEvents: [],
      errors: [],
    };
  }

  return {
    advisoryStatus: {
      status: "not_integrated",
      sourceName: COUNTY_SOURCE_NAME,
      message:
        "Live county advisory fetching is not wired yet. Ocean Planner will fall back to the official county advisory page for this mapped location.",
      advisoryUrl: SAN_DIEGO_COUNTY_BEACH_INFO_URL,
    },
    countyEvents: [],
    errors: [],
  };
}

export function summarizeCountyAdvisoryStatus(
  countyEvents: CountyWaterQualityEvent[],
): WaterQualityAdvisoryStatus {
  const primaryEvent = selectPrimaryCountyEvent(countyEvents);

  if (!primaryEvent) {
    return {
      status: "unavailable",
      sourceName: COUNTY_SOURCE_NAME,
      message: "County advisory details were unavailable for this location.",
      advisoryUrl: SAN_DIEGO_COUNTY_BEACH_INFO_URL,
    };
  }

  return {
    status: primaryEvent.status,
    sourceName: COUNTY_SOURCE_NAME,
    message:
      primaryEvent.publicNotification ??
      primaryEvent.descriptionIssue ??
      `${primaryEvent.beachName} is currently under a county ${primaryEvent.status}.`,
    advisoryUrl: SAN_DIEGO_COUNTY_BEACH_INFO_URL,
    issuedAt: primaryEvent.issuedAt,
    liftedAt: primaryEvent.liftedAt,
    stationId: primaryEvent.stationId,
    beachName: primaryEvent.beachName,
    countyEventId: primaryEvent.eventId,
  };
}

export function selectPrimaryCountyEvent(
  countyEvents: CountyWaterQualityEvent[],
): CountyWaterQualityEvent | undefined {
  return [...countyEvents].sort(compareCountyEvents).at(0);
}

function compareCountyEvents(
  left: CountyWaterQualityEvent,
  right: CountyWaterQualityEvent,
) {
  const severityDelta =
    COUNTY_STATUS_PRIORITY[right.status] - COUNTY_STATUS_PRIORITY[left.status];

  if (severityDelta !== 0) {
    return severityDelta;
  }

  const rightIssued = Date.parse(right.issuedAt ?? "");
  const leftIssued = Date.parse(left.issuedAt ?? "");

  if (Number.isFinite(rightIssued) && Number.isFinite(leftIssued) && rightIssued !== leftIssued) {
    return rightIssued - leftIssued;
  }

  return right.eventId.localeCompare(left.eventId);
}
