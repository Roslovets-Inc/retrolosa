import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Plugin } from "vite";

export function appManifest(base: string) {
  return {
    id: base,
    name: "Rétrolosa",
    short_name: "Rétrolosa",
    description: "Toulouse through the centuries, from historical maps to today’s streets.",
    lang: "en",
    start_url: base,
    scope: base,
    display: "standalone",
    background_color: "#efece3",
    theme_color: "#efece3",
    categories: ["education", "travel"],
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `${base}icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export function pwa(): Plugin {
  let base = "/";
  let root = "";
  return {
    name: "retrolosa-pwa",
    enforce: "post",
    configResolved(config) {
      base = config.base;
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== `${base}manifest.webmanifest`) return next();
        response.setHeader("Content-Type", "application/manifest+json");
        response.end(JSON.stringify(appManifest(base)));
      });
    },
    generateBundle(_options, bundle) {
      const manifest = JSON.stringify(appManifest(base), null, 2);
      this.emitFile({ type: "asset", fileName: "manifest.webmanifest", source: manifest });
      // Precache only the application shell. Map imagery and external providers stay network-only.
      const staticFiles = [
        "favicon.svg",
        "theme-init.js",
        "manifest.webmanifest",
        ...readdirSync(resolve(root, "public/fonts"))
          .filter((file) => /\.(css|woff2)$/.test(file))
          .map((file) => `fonts/${file}`),
        ...readdirSync(resolve(root, "public/icons"))
          .filter((file) => file.endsWith(".png"))
          .map((file) => `icons/${file}`),
      ];
      const builtFiles = Object.keys(bundle).filter((file) => /\.(js|css|html)$/.test(file));
      const revision = createHash("sha256");
      revision.update(base).update(manifest);
      for (const file of builtFiles) {
        const entry = bundle[file];
        revision.update(file).update(entry.type === "chunk" ? entry.code : entry.source);
      }
      for (const file of staticFiles.filter(
        (staticFile) => staticFile !== "manifest.webmanifest",
      )) {
        revision.update(file).update(readFileSync(resolve(root, "public", file)));
      }
      const files = [...new Set([...builtFiles, ...staticFiles])].map((file) => `${base}${file}`);
      const prefix = `retrolosa-shell-${encodeURIComponent(base)}-`;
      const cache = `${prefix}${revision.digest("hex").slice(0, 16)}`;
      const worker = `
const CACHE = ${JSON.stringify(cache)};
const PREFIX = ${JSON.stringify(prefix)};
const FILES = ${JSON.stringify(files)};
const HOME = ${JSON.stringify(base)};
const SHELL = new Set(FILES.map((file) => new URL(file, self.location.origin).href));
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});
// Let existing sessions finish before activating a new shell; never force a map reload.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && (url.pathname === HOME || url.pathname === HOME + "index.html")) {
    event.respondWith(fetch(request).then((response) => {
      if (!response.ok) throw new Error("Navigation unavailable");
      return response;
    }).catch(() => caches.open(CACHE).then((cache) => cache.match(HOME + "index.html"))));
  } else if (SHELL.has(url.href)) {
    // The shell is same-origin and fixed by this revision; server Vary headers must not hide precached modules.
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(request, { ignoreVary: true })) || fetch(request)));
  }
});
`;
      this.emitFile({ type: "asset", fileName: "sw.js", source: worker });
    },
  };
}
