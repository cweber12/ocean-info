export interface WeatherCondition {
  at: string;
  airTemperatureFahrenheit?: number;
  windSpeedMph?: number;
  windDirectionDegrees?: number;
  shortForecast?: string;
  sourceName: string;
}
