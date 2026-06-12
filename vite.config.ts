import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/movebank": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/api/ndbc": {
        target: "https://www.ndbc.noaa.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ndbc/, ""),
      },
    },
  },
});
