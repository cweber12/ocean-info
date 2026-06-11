export const appConfig = {
  name: import.meta.env.VITE_APP_NAME ?? "Tide Guide",
  hasBackend: false,
  features: {
    movebankTracking:
      String(import.meta.env.VITE_ENABLE_MOVEBANK_TRACKING ?? "false") ===
      "true",
  },
  movebank: {
    defaultDaysBack: Number(import.meta.env.VITE_MOVEBANK_DAYS_BACK ?? 7),
    defaultRadiusKm: Number(import.meta.env.VITE_MOVEBANK_RADIUS_KM ?? 25),
  },
};
