import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { pwa } from "./pwa.config.ts";
import { rasterAssets } from "./raster-assets.config.ts";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), rasterAssets(), pwa()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "maplibre", test: /node_modules[\\/]maplibre-gl[\\/]/, priority: 20 },
            { name: "vendor", test: /node_modules/, priority: 10 },
          ],
        },
      },
    },
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
