# Offline schema snapshots

`schemas.json` maps canonical schema URLs to unmodified parsed JSON documents.
Retrieved 2026-10-02 for deterministic offline tests and package validation.

- STAC Item and referenced common schemas: radiantearth/stac-spec tag v1.1.0,
  https://github.com/radiantearth/stac-spec/tree/v1.1.0/item-spec/json-schema
  (Apache-2.0).
- Projection: stac-extensions/projection tag v2.0.0,
  https://github.com/stac-extensions/projection/tree/v2.0.0 (Apache-2.0).
- GeoJSON Feature and Geometry: https://geojson.org/schema/ (public domain).
- PROJJSON v0.7: OSGeo/PROJ tag 9.4.0,
  https://github.com/OSGeo/PROJ/blob/9.4.0/schemas/v0.7/projjson.schema.json (MIT).

Canonical schema identifiers are retained even where the download used the
official GitHub mirror. These third-party schemas retain their respective licenses.
