export interface WeatherCondition {
  at: string;
  airTemperatureFahrenheit?: number;
  windSpeedMph?: number;
  windDirectionDegrees?: number;
  shortForecast?: string;
  sourceName: string;
}

export interface HourlyWeatherPoint extends WeatherCondition {
  windGustMph?: number;
  windDirection?: string;
  precipitationChancePercent?: number;
  relativeHumidityPercent?: number;
}

export interface HeaderWeatherSummary {
  temperatureFahrenheit?: number;
  windSpeedMph?: number;
  windDirection?: string;
  shortForecast?: string;
}

export interface WindObservation {
  at: string;
  speedKnots?: number;
  gustKnots?: number;
  directionDegrees?: number;
  direction?: string;
  sourceName: string;
  stationName: string;
}

export interface WaterTemperatureObservation {
  at: string;
  temperatureFahrenheit: number;
  sourceName: string;
  stationName: string;
}

export interface WaveObservation {
  at: string;
  heightFeet?: number;
  periodSeconds?: number;
  directionDegrees?: number;
  sourceName: string;
  stationName: string;
}

export interface CurrentObservation {
  at: string;
  speedKnots?: number;
  directionDegrees?: number;
  direction?: string;
  sourceName: string;
  stationName: string;
}

export interface MarineWeatherReport {
  date: string;
  locationId: string;
  sourceName: string;
  summary?: HeaderWeatherSummary;
  hourlyForecast: HourlyWeatherPoint[];
  windObservation?: WindObservation;
  waterTemperature?: WaterTemperatureObservation;
  waveObservation?: WaveObservation;
  currentObservation?: CurrentObservation;
  stationNames: {
    weather?: string;
    water?: string;
    waves?: string;
    current?: string;
  };
  unavailable: string[];
}
