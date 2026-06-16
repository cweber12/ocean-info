import { describe, expect, it } from "vitest";
import { buildWqpResultUrl, buildWqpStationUrl } from "./wqpClient";

describe("WQP URL builders", () => {
  it("builds the station URL with the default coastal bbox", () => {
    expect(buildWqpStationUrl()).toBe(
      "https://www.waterqualitydata.us/data/Station/search?mimeType=geojson&bBox=-117.4500%2C32.5200%2C-116.9000%2C33.3000",
    );
  });

  it("builds the result URL for a nearby characteristic query", () => {
    expect(
      buildWqpResultUrl({
        bBox: {
          west: -117.3,
          south: 32.82,
          east: -117.2,
          north: 32.9,
        },
        characteristicName: "Enterococcus",
        limit: 50,
        mimeType: "csv",
        startDateLo: "01-01-2025",
      }),
    ).toBe(
      "https://www.waterqualitydata.us/data/Result/search?mimeType=csv&bBox=-117.3000%2C32.8200%2C-117.2000%2C32.9000&characteristicName=Enterococcus&startDateLo=01-01-2025&limit=50",
    );
  });
});
