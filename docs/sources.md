# Source feasibility — 2026-09-29

## Selected prototype path

Reuse the already georeferenced raster tile rendering of the 1680 cadastral data from Makina Corpus. This is a modern cartographic interpretation of historical cadastral data, **not an original historical scan**. No new warping, control-point selection, or reconstructed geometry was performed.

- Original app: https://tolosa1680.makina-corpus.com/
- Public archive used by that app: https://makina-pmtiles.s3-website.fr-par.scw.cloud/tolosa-1680.pmtiles
- Equivalent S3 endpoint used here (verified HTTP 206 and CORS): https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1680.pmtiles
- PMTiles v3, 572,044,347 bytes total, accessed by small HTTP range requests, not downloaded in full.
- Header bounds: west 1.4179, south 43.5874, east 1.4629, north 43.6156; zoom levels 15–20.
- Metadata name: Toulouse1680; attribution and description fields empty. Attribution added explicitly based on the source application's credits.
- Source application's credits identify Toulouse Métropole's historical parcel dataset.

## Official data

https://data.toulouse-metropole.fr/api/explore/v2.1/catalog/datasets/parcellaire-de-1680

On the verification date this lists Mairie de Toulouse as publisher, “Parcellaire historique de Toulouse autour de 1680” as description, Licence Ouverte v2.0 (Etalab), but **zero records, no attachments and no alternative exports**. The v1 API confirms this. Do not mistake the existence of a catalog entry for a working vector download.

https://www.data.gouv.fr/api/1/datasets/parcellaire-de-1680-tm/ lists an older ZIP link on the discontinued /les-donnees/-/opendata path. Reusable vector download not established in this investigation. License descriptions may differ across catalogs; the live municipal metadata is recorded here without extrapolating it to third-party artwork.

UrbanHist+ https://www.urban-hist.toulouse.fr/uhplus/ loads a Business Geografic application. No reusable historical raster/IIIF endpoint or source control points were established in this initial investigation. It was unnecessary to reverse engineer its complete application for this prototype.

## Modern data

OpenFreeMap Positron vector style: https://tiles.openfreemap.org/styles/positron

Integration: https://openfreemap.org/quick_start/

Attribution: OpenFreeMap, OpenMapTiles, OpenStreetMap contributors. No OSM public raster tile server is used. Current database representation, not a dated aerial survey.

## Quality and limits

Quick-jump coordinates were checked against IGN's public geocoding endpoint `https://data.geopf.fr/geocodage/search` on 2026-09-29: Rue Ninau [1.44954, 43.597678], Place Saint Etienne [1.448962, 43.599782], Place Saintes Scarbes [1.448734, 43.598128], Place Montoulieu [1.450186, 43.596732]. These are navigation targets, not historical georeferencing control points.

Both maps use identical Web Mercator cameras. One interactive master drives the historical camera on every movement; clipping and opacity never change the geographic transformation. Rotation and pitch are disabled. This prevents UI drift but does not establish the historical source's absolute accuracy.

Historical control points, transformation parameters and RMS values are not supplied with this archive. Do not invent them or promise building-level precision. Source coverage and missing tiles must be distinguished from destroyed buildings. Independent visual inspection can check broad correspondence but cannot certify cadastral accuracy.

## Rights and publishing

Municipal data license does not establish rights to all third-party styling and icons. The source app credits individual icon creators. This prototype accesses its public remote tiles and links the complete source credits; it does not redistribute the archive. Separate permission/terms for production hosting and cartographic artwork remain unconfirmed. Before public deployment, clarify those terms or replace with a self-rendered layer from verified open source data. No public deployment performed.
