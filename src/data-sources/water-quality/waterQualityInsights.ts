import type {
  OceanConditionObservation,
  WaterQualityInsight,
  WaterQualitySample,
} from "../../domain/water/types";

export function buildWaterQualityInsights({
  bacteriaSamples,
  observations,
}: {
  bacteriaSamples: WaterQualitySample[];
  observations: OceanConditionObservation[];
}): WaterQualityInsight[] {
  const insights: WaterQualityInsight[] = [];
  const latestBacteriaSample = bacteriaSamples[0];
  const latestObservation = observations.at(-1);

  if (latestBacteriaSample) {
    const bacteriaSampleAgeDays = getSampleAgeDays(latestBacteriaSample);

    insights.push({
      id: "recent-bacteria-sample",
      severity:
        bacteriaSampleAgeDays !== undefined && bacteriaSampleAgeDays <= 3
          ? "watch"
          : "info",
      category: "bacteria",
      title: "Recent bacteria sample nearby",
      summary: buildBacteriaSummary(latestBacteriaSample),
      evidence: [
        {
          source: "WQP",
          label: latestBacteriaSample.characteristicName,
          value: latestBacteriaSample.value ?? latestBacteriaSample.rawValue,
          unit: latestBacteriaSample.unit,
          observedAt: latestBacteriaSample.sampleDateTime ?? latestBacteriaSample.sampleDate,
          stationName: latestBacteriaSample.stationName,
        },
      ],
      limitations: [
        "WQP is discrete lab/sample data and not a live beach advisory feed.",
        "Use official county advisories for current closures or posted warnings.",
      ],
    });
  } else {
    insights.push({
      id: "wqp-bacteria-gap",
      severity: "info",
      category: "data_gap",
      title: "No recent WQP bacteria samples found",
      summary:
        "No recent Enterococcus, E. coli, or coliform samples were found in this search area. Check official county advisories for current safety status.",
      evidence: [],
      limitations: [
        "Absence of a sample is not a clean bill of health.",
        "Official county advisories are not integrated yet in this panel.",
      ],
    });
  }

  if (latestObservation?.waterTemperatureC !== undefined) {
    const previousTemperature = findObservationNearHoursAgo(
      observations,
      latestObservation.observedAt,
      24,
    )?.waterTemperatureC;
    const fahrenheit = celsiusToFahrenheit(latestObservation.waterTemperatureC);
    const trend =
      previousTemperature === undefined
        ? "No 24-hour trend available yet."
        : describeTemperatureTrend(latestObservation.waterTemperatureC - previousTemperature);

    insights.push({
      id: "sccoos-water-temperature",
      severity: "info",
      category: "water_temperature",
      title: "Scripps Pier water temperature",
      summary: `${latestObservation.waterTemperatureC.toFixed(1)} C (${fahrenheit.toFixed(
        1,
      )} F). ${trend}`,
      evidence: [
        {
          source: "SCCOOS",
          label: "Water temperature",
          value: latestObservation.waterTemperatureC.toFixed(1),
          unit: "C",
          observedAt: latestObservation.observedAt,
          stationName: latestObservation.stationName,
        },
      ],
      limitations: [
        "SCCOOS is near-real-time sensor data from Scripps Pier, not every selected beach.",
      ],
    });
  }

  if (latestObservation?.turbidityNtu !== undefined) {
    insights.push({
      id: "sccoos-visibility",
      severity: latestObservation.turbidityNtu >= 5 ? "watch" : "info",
      category: "visibility",
      title: "Visibility context",
      summary:
        latestObservation.turbidityNtu >= 5
          ? "Higher turbidity may mean reduced water clarity near shore."
          : "Recent turbidity is relatively low at Scripps Pier, which is a better sign for clarity than a murky reading.",
      evidence: [
        {
          source: "SCCOOS",
          label: "Turbidity",
          value: latestObservation.turbidityNtu,
          unit: "NTU",
          observedAt: latestObservation.observedAt,
          stationName: latestObservation.stationName,
        },
      ],
      limitations: [
        "Turbidity is a visibility/runoff proxy and does not prove bacteria conditions.",
      ],
    });
  }

  if (latestObservation?.chlorophyllUgL !== undefined) {
    insights.push({
      id: "sccoos-chlorophyll",
      severity: latestObservation.chlorophyllUgL >= 10 ? "watch" : "info",
      category: "algae",
      title: "Algae context",
      summary:
        latestObservation.chlorophyllUgL >= 10
          ? "Elevated chlorophyll can suggest stronger phytoplankton activity."
          : "Chlorophyll is being tracked for bloom context, but this is not a harmful algal bloom determination.",
      evidence: [
        {
          source: "SCCOOS",
          label: "Chlorophyll",
          value: latestObservation.chlorophyllUgL,
          unit: "ug/L",
          observedAt: latestObservation.observedAt,
          stationName: latestObservation.stationName,
        },
      ],
      limitations: [
        "Chlorophyll alone should not be treated as a harmful algal bloom warning.",
      ],
    });
  }

  if (latestObservation?.dissolvedOxygen) {
    insights.push({
      id: "sccoos-oxygen",
      severity: latestObservation.dissolvedOxygen.value < 4 ? "caution" : "info",
      category: "oxygen",
      title: "Dissolved oxygen context",
      summary:
        latestObservation.dissolvedOxygen.value < 4
          ? "Lower dissolved oxygen can signal ecological stress in coastal water."
          : "Dissolved oxygen is available as ecology context, not a direct swimmer safety metric.",
      evidence: [
        {
          source: "SCCOOS",
          label: "Dissolved oxygen",
          value: latestObservation.dissolvedOxygen.value,
          unit: latestObservation.dissolvedOxygen.unit,
          observedAt: latestObservation.observedAt,
          stationName: latestObservation.stationName,
        },
      ],
      limitations: [
        "This metric is most useful for ecology and water-condition context.",
      ],
    });
  }

  return insights;
}

function buildBacteriaSummary(sample: WaterQualitySample) {
  const ageDays = getSampleAgeDays(sample);
  const value = sample.value ?? sample.rawValue ?? "sample available";
  const unit = sample.unit ? ` ${sample.unit}` : "";
  const ageLabel =
    ageDays === undefined
      ? "Sample age unavailable."
      : ageDays <= 1
        ? "Collected within the last day."
        : `Collected ${ageDays} days ago.`;

  return `${sample.characteristicName} at ${sample.stationName ?? "a nearby station"}: ${value}${unit}. ${ageLabel}`;
}

function getSampleAgeDays(sample: WaterQualitySample) {
  const value = sample.sampleDateTime ?? sample.sampleDate;

  if (!value) {
    return undefined;
  }

  const sampleTime = Date.parse(value);

  if (Number.isNaN(sampleTime)) {
    return undefined;
  }

  return Math.max(0, Math.floor((Date.now() - sampleTime) / (24 * 60 * 60 * 1000)));
}

function findObservationNearHoursAgo(
  observations: OceanConditionObservation[],
  observedAt: string,
  hoursAgo: number,
) {
  const target = Date.parse(observedAt) - hoursAgo * 60 * 60 * 1000;

  return observations.reduce<OceanConditionObservation | undefined>((closest, observation) => {
    if (observation.waterTemperatureC === undefined) {
      return closest;
    }

    const difference = Math.abs(Date.parse(observation.observedAt) - target);
    const bestDifference = closest
      ? Math.abs(Date.parse(closest.observedAt) - target)
      : Number.POSITIVE_INFINITY;

    return difference < bestDifference ? observation : closest;
  }, undefined);
}

function describeTemperatureTrend(deltaC: number) {
  if (Math.abs(deltaC) < 0.3) {
    return "Temperature is roughly flat versus 24 hours ago.";
  }

  if (deltaC > 0) {
    return `Up about ${deltaC.toFixed(1)} C versus 24 hours ago.`;
  }

  return `Down about ${Math.abs(deltaC).toFixed(1)} C versus 24 hours ago.`;
}

function celsiusToFahrenheit(value: number) {
  return (value * 9) / 5 + 32;
}
