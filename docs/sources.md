# Source feasibility — 2026-09-29

## Continuous timeline

The Time mode interpolates opacity between the enabled historical sources (1631, 1680, 1830, 1875 and 1954) and the modern basemap, not historical geometry or building dates. All historical sources coexist in one MapLibre style so scrubbing only updates paint opacity. Disabled epochs are skipped. Source dates are positioned proportionally along the slider; pointer input snaps within 20% of each local interval. Intermediate labels report the source pair without a blend percentage or a claimed surveyed intermediate year. Time mode and slider position are included only when explicitly generating a shared URL; navigation does not rewrite the address.

Remaining candidates and priorities are maintained in [map-backlog.md](map-backlog.md).

## Added Tavernier plan 1631 (approximate alignment)

Original source: [Archives municipales de Toulouse, II 671](https://www.flickr.com/photos/archives-toulouse/24484342123/), Melchior Tavernier, 1631. The official source marks the scan public domain. Original raster 7874 × 5884 pixels; checksum, source URL and manual landmark coordinates are versioned in `data/tavernier-1631-control-points.json`.

Revision 3 includes the full landmark re-identification from revision 2 and a local Nazareth correction. The earlier fit confused Porte Pouzonville with Porte Arnaud-Bernard, Cordeliers with Jacobins, and the former Pont Couvert with Pont Neuf. Those are annotation errors, not historical changes. Landmarks were re-read against the numbered/lettered legend of the full-resolution scan. Ground footprints and tower bases are used instead of roof tops. Modern church footprints were cross-checked against OpenStreetMap geometries and PLAN IGN; street geocodes supply approximate context, not building coordinates.

`scripts/build-tavernier.py` reproduces local WebP tiles at zooms 14–17 and a low-zoom overview, with the same Python dependencies as the flood generator. Twenty-two correspondences now span Saint-Sernin, Arnaud-Bernard, Saint-Pierre, Jacobins, Capitole, Saint-Georges, Augustins, Saint-Etienne, Daurade, both Pont Neuf abutments, Saint-Cyprien, Carmes, Rouaix, Mage, Dalbade and Salin, plus three Nazareth junctions (Perchepinte, Philippe Feral and Languedoc). Place Mage now uses its actual OSM street-junction coordinates [744.09, 746.4], replacing the misplaced reference [757, 770] that displaced this neighbourhood. Modern Nazareth geometry comes from OSM ways 115572305 and 791005603; neighbouring junctions from ways 22529543, 22530936, 22530935 and 186598289, accessed 2026-09-30. The inverse thin-plate spline uses smoothing 500 in reference annotation pixels. An affine fit and spline smoothing 0, 25, 100, 500 and 2000 were compared. Smoothing 500 retains modest regularization while keeping all fitting residuals below 16 m and positive sampled inverse Jacobians. These fitting residuals describe the warp, not absolute accuracy of hand-identified landmarks.

Four withheld checks measure the actual inverse renderer: Saint-Antoine du Salin chapel 39.2 m, the former Tresorerie / Temple du Salin 34.6 m, Nazareth / Coffres 27.3 m and Nazareth / Antoine Darquier 8.3 m. These checks cover the southern area, not the entire city. The two Nazareth intersections are not used for fitting. Applying revision 2 to the same two manually identified checkpoints gives 93.4 and 89.5 m respectively, so this comparison uses identical landmarks rather than changing the test set to claim improvement. Each of the twenty-two fitting points is also omitted in turn and re-evaluated: leave-one-out median 57.5 m, maximum 113.7 m. This exposes the perspective drawing's local distortions and areas that depend on their nearby anchors. Full current measurements are in `data/tavernier-1631-validation.json`.

Unlike the former forward-only check, the validation now samples the **actual inverse mapping throughout the complete sheet**, at four reference annotation pixels: 22,827 visible samples, minimum determinant 1.387, no sampled folds. This is a sampled check, not a mathematical guarantee. Revision 4 removes the polygon mask and retains the complete sheet, printed margins, cartouche and legend. Tile bounds follow the entire warped sheet boundary with padding; the original JPEG is also available locally. The existing landmark fit is unchanged. Areas outside the control-point network remain less reliable. Roofs displaced by the original perspective cannot coincide with modern building footprints even when their ground anchors agree. The interface retains the approximate-alignment label and links the unwarped original. All five historical epochs remain in the same map style; 1631 can be disabled and skipped by the timeline.

Run `python scripts/build-tavernier.py --validate-only` with numpy, scipy and Pillow available to check geometry without modifying assets. Run without the option only when explicitly regenerating the map. Visual review compares the resulting overlay around Saint-Sernin/Capitole, Daurade/Pont Neuf, Saint-Cyprien and Carmes/Salin against the PLAN IGN reference mosaic; passing browser loading tests alone does not validate alignment.

## Added 1830 layer

Original application: https://tolosa.makina-corpus.com/ credits the historical parcel dataset https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-1830/. The live municipal API reports Mairie de Toulouse and Licence Ouverte v2.0 (Etalab) on 2026-09-29. The artwork/hosting caveats below also apply to this third-party rendering.

Archive: https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1830.pmtiles. Verified PMTiles v3 and successful range requests. Bounds [1.4127, 43.5829, 1.4616, 43.6169], zoom 15–20, metadata name Toulouse1830. Georeferencing is reused unchanged. This is a rendering of cadastral data, not an original scan. No new historical control points or accuracy claims are introduced.

`node scripts/build-overview.mjs 1830` creates the 30-tile low-zoom mosaic and exact tile-grid coordinates. The epoch selector preserves camera, comparison settings and location markers. Shared view URLs include `year=1830` or `year=1680`; older URLs default to 1680.

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

The 1680 zoom-out overview is a 5×5 mosaic of the source's minimum-zoom tiles, generated by `scripts/build-overview.mjs`. Its four corners are calculated from the original Web Mercator tile grid, not manually selected control points; no new geographic warp is applied. Below zoom 15 this local overview replaces detailed remote tiles. The original attribution and artwork caveats apply to the derived overview as well. The modern map remains visible outside the historical coverage. Navigation is limited to Toulouse and its surroundings, with zoom 11.5–19 and bounds [1.30, 43.49, 1.57, 43.75]. Initial and reset views show the city centre rather than one street.

Quick-jump coordinates were checked against IGN's public geocoding endpoint `https://data.geopf.fr/geocodage/search` on 2026-09-29: Rue Ninau [1.44954, 43.597678], Place Saint Etienne [1.448962, 43.599782], Place Saintes Scarbes [1.448734, 43.598128], Place Montoulieu [1.450186, 43.596732]. These are navigation targets, not historical georeferencing control points.

Both maps use identical Web Mercator cameras. One interactive master drives the historical camera on every movement; clipping and opacity never change the geographic transformation. Rotation and pitch are disabled. This prevents UI drift but does not establish the historical source's absolute accuracy.

Historical control points, transformation parameters and RMS values are not supplied with this archive. Do not invent them or promise building-level precision. Source coverage and missing tiles must be distinguished from destroyed buildings. Independent visual inspection can check broad correspondence but cannot certify cadastral accuracy.

## Rights and publishing

Municipal data license does not establish rights to all third-party styling and icons. The source app credits individual icon creators. This prototype accesses its public remote tiles and links the complete source credits; it does not redistribute the archive. Separate permission/terms for production hosting and cartographic artwork remain unconfirmed. Before public deployment, clarify those terms or replace with a self-rendered layer from verified open source data. The prototype has been deployed to Sites with owner-only access; no public-access deployment is recorded.

## Added aerial photography 1954

IGN / Edugéo WMTS layer ORTHOIMAGERY.EDUGEO.TOULOUSE1954, style normal, PNG, PM_6_16 (zooms 6–16). Live GetCapabilities and actual central Toulouse tile checked 2026-09-29. Bounds [1.23852, 43.5618, 1.55128, 43.7247]. Original georeferencing reused; no new accuracy claim or resampling. Higher map zooms overzoom the original tiles. Source: https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities . The timeline retains all sources in one style and blends successive dates, with no invented intermediate imagery.

## 1875 flood plan (added September 2026)

Original Sirven / La Dépêche plan of the 23–24 June 1875 flood, Archives municipales de Toulouse, **20 Fi 45** (stamp on scan).

- Scan: https://mapasmilhaud.com/wp-content/uploads/2026/07/1384-Plano-de-las-inundaciones-de-Toulouse-1875.jpg
- Description: https://mapasmilhaud.com/mapas-urbanos/plano-de-las-inundaciones-de-toulouse-1875/
- Original size 4843 × 5852; SHA-256 in data/flood-1875-control-points.json.
- Blue marks flooded areas; red marks collapsed houses. This is historical evidence, not present-day flood-risk data.
- Historical artwork is public domain by age. Specific scan reuse terms have not been independently confirmed; retain archive and scan-provider attribution in this private prototype.

### Reproducible alignment

scripts/build-flood.py downloads and verifies the original, masks its printed border, title and publisher inset, and renders transparent WebP tiles at zooms 14–17 plus a low-zoom overview. Requires Python, numpy, scipy and Pillow. Run from the repository root with those packages available. Generated assets are committed so deployment does not need Python.

Manual correspondences are in data/flood-1875-control-points.json. Old-plan coordinates use a 1200 px wide annotation image; reference coordinates use a 1200 px wide IGN PLANIGNV2 mosaic (1536 × 1792 original, zoom 15, origin tile 16512/11962). Reference service: https://data.geopf.fr/wmts (GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2).

Fifteen fitting landmarks span bridges, churches, squares and road junctions. A thin-plate spline in Web Mercator uses smoothing 1000. Three withheld landmarks test the rendered inverse transformation: La Grave dome 13.7 m, Jacobins cloister 20.0 m, Saint-Étienne west portal 26.8 m. These are manual central-landmark checks, not a citywide accuracy claim or a survey. Edges outside the fitting network are less reliable. No folds were detected in the sampled forward Jacobian grid; this is a sampled check, not a mathematical guarantee. Full measurements and artifact size are in data/flood-1875-validation.json.
