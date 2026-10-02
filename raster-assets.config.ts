import type { Plugin } from "vite";

import { RASTER_ITEMS } from "./src/epochs/raster-items.ts";

/** Keep one editable Item while delivering it beside its image in dev and builds. */
export function rasterAssets(): Plugin {
  const items = Object.values(RASTER_ITEMS).map((item) => ({
    destination: `${item.id}/item.json`,
    source: JSON.stringify(item, null, 2) + "\n",
  }));
  return {
    name: "retrolosa-raster-items",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        const item = items.find(
          (entry) => pathname === `${server.config.base}${entry.destination}`,
        );
        if (!item) return next();
        response.setHeader("Content-Type", "application/geo+json; charset=utf-8");
        response.end(item.source);
      });
    },
    generateBundle() {
      for (const item of items)
        this.emitFile({ type: "asset", fileName: item.destination, source: item.source });
    },
  };
}
