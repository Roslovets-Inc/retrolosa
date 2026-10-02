import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Ajv from "ajv";

import profile from "../data/stac/raster-v1.schema.json";
import schemas from "../data/stac/vendor/schemas.json";
import { readStacRaster } from "../src/epochs/stac";

const path = process.argv[2];
if (!path) throw new Error("Usage: bun run maps:validate <path/to/item.json>");
const item = JSON.parse(readFileSync(path, "utf8"));
const ajv = new Ajv({ allErrors: true, unknownFormats: "ignore" });
for (const [url, schema] of Object.entries(schemas)) ajv.addSchema(schema, url);
for (const schema of [
  "https://schemas.stacspec.org/v1.1.0/item-spec/json-schema/item.json",
  "https://stac-extensions.github.io/projection/v2.0.0/schema.json",
  profile,
]) {
  if (!ajv.validate(schema, item)) throw new Error(ajv.errorsText());
}
readStacRaster(item, "item.json");
const asset = readFileSync(resolve(dirname(path), item.assets.display.href));
if (createHash("sha256").update(asset).digest("hex") !== item.properties["retrolosa:raster_sha256"])
  throw new Error("WebP SHA-256 does not match STAC metadata");
console.log(`Valid STAC raster package: ${item.id}`);
