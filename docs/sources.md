## Unified timeline controls

## Current 1860 source and delivery

The current map is approved revision `2026-10-06-streets-01`, prepared from
the approved `2026-10-02-user-02` baseline with Rue du Taur correspondences. Its editable source is
`data/georeferencing/jourdan-1860.json`; its latest GDAL report is
`data/georeferencing/jourdan-1860-report.json`. Preserve the original scan in
`data/map-sources/jourdan-1860/original.jpg`. The site consumes only
`public/jourdan-1860/map.webp` and `data/stac/jourdan-1860.item.json`.
There are 75 fit points and 32 withheld checks; check RMSE is 15.17 m.
The same 29 inherited checks change from 15.62 m to 15.70 m RMSE; this revision
does not establish an overall accuracy improvement. Esquile remains unresolved
and is excluded from fitting. The tracing and comparison are preserved in
`data/georeferencing/jourdan-1860-street-tracing.json` and
`data/georeferencing/jourdan-1860-comparison.json`. The user accepted the visual alignment against the street overlay on 2026-10-06.
Local regressions at Notre-Dame du Taur and other checks remain recorded.
The approved baseline remains in Git; a local rollback copy is also in
`.local/1860-before-street-review/`. Publication has not been requested.
This measures consistency with manual annotations, not survey accuracy.
Historical revision folders, duplicate previews and obsolete metadata have been
removed. Use Git for future history; commit current source records with each
accepted delivery update. No commit is implied by this cleanup.

The time slider is always available. Superposition, curtain and loupe are comparison tools above the same timeline; changing tools preserves the selected calendar year, layer blending and opacity. Epoch ticks select source dates directly, and the Époques menu beside the comparison tools, directly above the slider, selects which sources participate. Population, events, orientation and the source dialog follow the timeline in every tool. Shared URLs store both the tool and time. Legacy `mode=time` links open the unified timeline in superposition, preserving their opacity; historical-only and current-only links retain their transparency rules.

## Attribution display

The footer credits only historical sheets participating in the visible timeline blend,
including both sheets during a crossfade. It hides historical credits for the modern-only
view and zero historical opacity. OpenMapTiles and OpenStreetMap remain visible with links;
OpenFreeMap and the complete list of thirteen historical sources and authors are available
in the existing source dialog. Footer text is legible rather than compressed to 7px on mobile.
OpenFreeMap explicitly permits omitting its own name from the on-map attribution:
<https://openfreemap.org/#attribution>. OSM guidance is at
<https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Interactive_maps>.
Attribution does not resolve the source-rights uncertainties documented below.

# Source feasibility — 2026-09-29

## Continuous timeline

The unified timeline interpolates opacity between enabled historical sources and the modern basemap, not historical geometry or building dates. The current catalogue contains thirteen historical epochs. Only contributing sources and their immediate enabled neighbours coexist in the historical style; neighbours stay transparent and prepared across snapped dates. Disabled epochs are skipped. Visual interval widths are bounded by `timelineStops`, while interpolation inside each interval uses calendar years. Pointer input snaps within 20% of each local interval. Intermediate labels report the source pair without a blend percentage or a claimed surveyed intermediate year. The comparison tool and calendar year are included when explicitly generating a shared URL; ordinary navigation does not rewrite the address. See [architecture](architecture.md) for the current source lifecycle and legacy link compatibility; the dated research below records source investigations rather than the current UI architecture.

Remaining candidates and priorities are maintained in [map-backlog.md](map-backlog.md).

## Twelfth-century fragments (partial reconstruction)

Figure 9 of Quitterie Cazes's study, drawn by F. Callède / Inrap, is integrated as
`1195` with the XII-century label. Its original legend distinguishes growth circa
1107, circa 1150, after 1150 and after 1191. 1195 is only a timeline ordering anchor.
The fossil parcel background derives from the reconstructed 1550 cadastre. This
is neither a complete city map nor a single-year state. The map now also includes
selected Romanesque features from figure 4's Saint-Étienne quarter and figure 11's
late-XII-century Narbonnais castle. Gaps between the three regions are transparent.
Full drawings and original legends remain accessible in the sources dialog.
Figure 3 enriches Saint-Pierre-des-Cuisines inside the borough with red phases
circa 1100/1150 and light-green circa 1180. Yellow 1050, teal Late Middle Ages and
grey later elements are excluded; this multiphase detail is not a single-year state.
Two separate nave corners differ by 3.8 and 7.0 m from IGN. The detail replaces
the coarse church symbol locally without extending the region's coverage.

Three points transfer alignment through figure 6, followed by direct translation
onto the corrected Saint-Sernin crossing in IGN Plan v2. Saint-Pierre-des-Cuisines
differs by 15.9 m from IGN; two withheld gates differ by 19.1 and 19.8 m from
figure 6. Saint-Étienne's two cathedral-corner checks give 4.9 and 7.8 m versus IGN;
they do not validate the whole quarter. Its pale-yellow XIII-century extension and
grey later features are excluded. Castle placement uses figure 6's symbol, the
north arrow and figure 11's printed scale; it has no independent survey validation
and is explicitly labelled approximate. These measurements do not establish historical accuracy. See
[the preparation record](openedition-medieval-layers.md#twelfth-century-borough-layer--2026-10-01)
for inputs, generation and unresolved illustration reuse terms.

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

The 1680 zoom-out overview is a 5×5 mosaic of the source's minimum-zoom tiles, generated by `scripts/build-overview.mjs`. Its four corners are calculated from the original Web Mercator tile grid, not manually selected control points; no new geographic warp is applied. Below zoom 15 this local overview replaces detailed remote tiles. The original attribution and artwork caveats apply to the derived overview as well. The modern map remains visible outside the historical coverage. Navigation is limited to Toulouse and its surroundings, with zoom 10.5–19 and bounds [1.18, 43.38, 1.70, 43.86]. Initial and reset views show the city centre rather than one street.

The current selector contains Place du Capitole, Basilique Saint-Sernin, Couvent des Jacobins, Saint-Étienne, Pont Neuf and Dôme de la Grave, plus a city-centre overview. The selection follows [Toulouse Tourisme's major landmarks](https://www.toulouse-tourisme.com/nos-incontournables/). Targets reuse the versioned IGN reference annotations in `src/etat-major-alignment.json` and `data/flood-1875-control-points.json`, converted from their Web Mercator reference grid to longitude and latitude. Saint-Étienne retains its existing IGN-geocoded square target [1.448962, 43.599782]. These are navigation targets, not new alignment measurements. Rue Ninau, Saintes-Scarbes and Montoulieu are no longer selector entries.

Both maps use identical Web Mercator cameras. One interactive master drives the historical camera on every movement; clipping and opacity never change the geographic transformation. Pitch and rotation gestures are disabled; the compass sets a shared bearing that persists through timeline changes. This prevents UI drift but does not establish the historical source's absolute accuracy.

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

## Jourdan and Rivière, circa 1860; Laffont, 1904

Both complete original sheets are integrated as corrected Web Mercator image layers,
without cropping legends, margins, cartouches or inset maps. Full-resolution JPEGs
are accessible from the source dialog. Source images, checksums, manual annotations
and independent checks are recorded in `data/jourdan-1860-control-points.json` and
`data/laffont-1904-control-points.json`. Run `scripts/build-city-plans.py` explicitly
with numpy, scipy and Pillow to reproduce the assets; regular builds do not regenerate them.

Fifty-one fitting landmarks on 1860 and thirty-seven on 1904 span preserved street
junctions, canal bridges, Grand Rond and Saint-Cyprien. The quarter survey adds
street axes around Dalbade, Taur, Jardin Royal, Rue Valade and Rue Quilmery.
Modern junctions are cross-checked against OpenStreetMap node coordinates,
recorded with attribution in `data/street-reference-junctions.json`.
The modern Tour-du-Sac through-junction is absent on the 1904 sheet and is
excluded consistently; its preserved junction on Rue de la Laque is withheld.
Three ambiguous 1904 Dalbade candidates are also rejected and recorded.

The affine sheet frame stays fixed. An inverse thin-plate spline corrects local
geometry, with fixed sheet boundaries and soft prior samples restraining drift.
The 1860 local survey omits contradictory prior samples within 80 annotation
pixels of its new observations; dense 4-pixel Jacobian samples inspect these
neighbourhoods in addition to the full-sheet grid.
The 1904 model preserves the preceding 32-anchor field between observations;
new observations receive softer weight because the drawn street edges are less
precise. A sampled inverse Jacobian rejects compression below 0.3.
The initial fifteen independent church, square and street-junction checks evaluate the actual
16-pixel renderer mesh. On identical revised annotations, mean error changes
from 28.3 to 20.1 m for 1860 and from 18.3 to 18.1 m for 1904; maxima remain
51.9 and 40.8 m. The 1904 gain is small, and some individual checks worsen.
These manual checks do not establish survey accuracy or exact alignment of
all streets. Fit residuals are not independent accuracy estimates.

The 2026-10-02 survey refines the three reported areas: Parlement / the former
Carmelite block, Brienne / Bazacle, and Saint-Aubin. Eleven fitting junctions and
five withheld checks supplement the earlier network. The Riquet / Colombette
anchor was misidentified on both the scan and reference; it now matches the
preserved Rue Pierre-Paul Riquet junction west of the church. Amelie and Mercadier
street cuts through the northern plot are absent on the historical sheet and are
not matched. Sabots / Feuga was rejected because the old street opens onto an
irregular square rather than a comparable through-road intersection; its trial
measurements and rejection remain recorded in `excludedLandmarks`.

The preceding 40-anchor 1860 field is frozen in
`data/jourdan-1860-local-baseline.json`. Identical current annotations, evaluated
through the actual renderer mesh, give these independent errors:

| Area / withheld landmark                       | Before (m) | After (m) |
| ---------------------------------------------- | ---------- | --------- |
| Parlement: Sainte-Catherine / Trente-Six-Ponts | 57.3       | 34.8      |
| Parlement: Mespoul / Viadieu                   | 43.9       | 2.9       |
| Brienne: Lejeune / Barcelone                   | 62.7       | 22.9      |
| Saint-Aubin: drawn nave centre                 | 79.9       | 32.3      |
| Saint-Aubin / Aubuisson                        | 44.3       | 16.6      |
| Caffarelli / Stalingrad                        | 137.4      | 20.1      |
| Belfort: eastern street opening                | 137.0      | 6.7       |
| Heliot / Dalayrac                              | 103.2      | 15.0      |
| Arnaud-Bernard / Trois-Piliers                 | 107.5      | 49.7      |
| Gatien-Arnoult / Saint-Charles                 | 9.5        | 19.1      |
| Verge-d-Or / Escoussieres                      | 29.4       | 32.4      |
| Lois / Salenques / Peyrou                      | 49.1       | 7.5       |
| Puits-Creuses / Saint-Julien                   | 69.2       | 30.4      |

Across all thirty-two checks, mean error decreases from 47.8 to 20.2 m. The old
fifteen-check mean is 19.5 m, but individual changes remain: notably,
Saint-Pierre-des-Cuisines worsens from 18.9 to 31.3 m. Maximum error is 51.8 m;
minimum sampled inverse Jacobian is 0.3523 (required >0.3), with fixed sheet
boundaries. These sparse manual checks do not guarantee every drawn street or
building footprint. The church drawing, changing quays and proposed alignments
retain historical differences from the present map.

The northeast refinement matches former Place Castelet to Place Belfort and
Allées Louis-Napoleon / Lafayette to Allées Jean-Jaures. The original Bayard and
Matabiau bridge annotations were south of the actual crossings and are corrected.
Six additional fitting openings constrain both ends of the promenade, Caffarelli,
Heliot and Denfert-Rochereau. Three new observations remain withheld. Later Lafon
and Bertrand-de-Born cuts are not forced onto this sheet. Exploratory western
Bayard / Strasbourg and Jacques-Laffitte correspondences remain excluded and
documented: projected streets and subsequent widening make their identification
ambiguous. The exploratory Jacques-Laffitte error was 85.1 m; it is not part of
the final preserved-landmark accuracy summary. This limits the accuracy claim
for western Bayard at that stage; the following refinement resolves Saint-Loup. Historical context: [Municipal Archives, Rue Bayard](https://archives.toulouse.fr/rue-bayard/).

Pont des Minimes was subsequently corrected on the original scan from
[690, 173] to [637.5, 174.5]. The former annotation lay east along the canal,
outside the crossing. Its existing modern bridge centre [564.34, 303.11] is
retained. The local correction also moves the adjoining former Faubourg
Arnaud-Bernard street. No new independent Minimes accuracy claim is made;
the existing twenty-three checks remain withheld and retain the same annotations.

The following Arnaud-Bernard refinement replaces the misplaced original
Lascrosses / boulevard anchor [676, 337.3], inside a block, with [650.5, 344.5].
Five fitting junctions constrain Queteurs, Embarthe / Chaine, Gramat, Verge-d-Or
and Trois-Piliers northwest of Saint-Sernin. Three additional withheld checks
average 48.8 m before and 33.9 m after. Two individual observations worsen and
the square retains a 49.8 m residual; this is a local improvement, not a claim
that all historical block outlines match the modern street layout.

The southern continuation around Saint-Julien / Peyrou adds four fitting
junctions: Embarthe / Salenques, Chaine / Peyrou, Puits-Creuses / Albert-Lautman
and Urbain-Vitry / Albert-Lautman. Two withheld observations improve from
59.2 m to 18.7 m on average against the frozen 40-anchor field. The old
Place et Rue des Salenques extends through present Place Saint-Julien; the
plaza shape and road openings are not identical. Valade / De-la-Bastide also
improves from 36.7 m to 14.5 m; Saint-Pierre-des-Cuisines worsens, as recorded above.

Regenerate just this sheet with
`python scripts/build-city-plans.py --plan jourdan-1860`; omitting `--plan` still
builds both plans. Its revision is part of the raster URL to invalidate old caches.

The earlier fields are frozen in `data/*-street-baseline.json`;
the original 13-anchor affine frame is retained in `data/*-alignment-baseline.json`.
Full measurements are in `data/*-validation.json`. Source margins, legends,
insets and unmodified JPEGs remain complete. The 1860 document includes
proposed alignments; 1904 includes the projected Amidonniers bridge.

Source provenance and reuse statements are detailed in [map-backlog.md](map-backlog.md).
The periods participate in epoch selection, chronological blending and shared URLs.
Mobile year buttons occupy two rows, with staggered timeline labels.

## État-major 1848 — verified IGN catalogue date

The new epoch uses `GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40` from the official
`https://data.geopf.fr/wmts` service. JPEG tiles, 256 pixels, matrix set `PM_6_15`,
zooms 6–15; higher map zooms overzoom the historical raster. IGN georeferencing is
corrected over a dense network of 30 preserved street, bridge and monument
anchors, including Grand Rond. A thin-plate spline inverse is sampled onto a
shared grid every eight annotation pixels. Soft prior samples preserve the
previous correction between anchors. At the mosaic boundary it returns to the
earlier translation (about 4.5 m east and 58 m south); surrounding countryside
is not newly fitted. Fifteen withheld landmarks and bridge approaches measure
the actual bilinear grid: mean error 18.5 to 17.8 m, maximum 28.5 m after correction.
The comparison uses the immediately preceding 22-anchor field, frozen in
`data/etat-major-street-baseline.json`, and identical revised annotations.
Some individual checks worsen; the low-resolution 1:40000 drawing remains
approximate. Manual annotations are in `data/etat-major-control-points.json`,
the initial translation/local-affine baseline in `data/etat-major-alignment-baseline.json`,
and the full comparison in `data/etat-major-validation.json`. Run
`scripts/build-etat-major-alignment.py` explicitly with numpy and scipy to
export the runtime model in `src/etat-major-alignment.json`.
`src/etat-major.ts` assembles
neighbouring live IGN tiles before bilinear sampling through a shared world-coordinate
inverse, avoiding seams. Sampled Jacobians check that the local warp does not fold.
The correction is constant in ground units at every zoom, including overzoom.
It is a local alignment, not a new survey or a correction validated across the
surrounding countryside. The layer is limited to the application's navigation bounds
[1.30, 43.49, 1.57, 43.75], whose intersecting source sheets were checked.

On 2026-10-01, the official Remonter le temps catalogue WFS
`https://data.geopf.fr/wfs`, type `cartes_anciennes:image`, dataset `ETATMAJOR`,
returned central sheet **230 NO, TOULOUSE, date 1848**:
`IGNF_SCAN_EM_40K_1-0__2009-07-02__SCAN_4EM230NO_40K_1848`.
All six sheets intersecting the navigation bounds have catalogue date **1848**:
Toulouse 230 NO, NE, SO and SE, and Montauban 218 SO and SE. Their complete
properties and footprints in EPSG:3857 are stored in
`data/etat-major-1848-metadata.json`. Query the geometry in EPSG:3857, not with
unprojected longitude/latitude. The 2009 component in an image identifier is not
the historical date. The national 1820–1866 series range is not the Toulouse date.

1848 is the catalogue millésime of the coloured 1:40,000 minutes. The
[official dataset](https://www.data.gouv.fr/datasets/scan-etat-major-r-40k-1)
notes partial additions to the series, notably railways, until 1889. Do not
interpret every depicted object as present in 1848 or label the raster as an
unaltered survey from that year. This limit is explained in the source dialog.
The [IGN FAQ](https://remonterletemps.ign.fr/faq) distinguishes the coloured
minutes from the engraved 1:80,000 map and permits reuse under Licence Ouverte 2.0.
Keep IGN attribution and the source/date information.

A central Toulouse tile was successfully fetched (HTTP 200, JPEG, CORS `*`).
The map covers the countryside as well as the city; it is useful for territorial
comparison, without a cadastral precision claim. The new layer participates in
chronological blends, source selection, north orientation and shared URLs.

The Strasbourg refinement adds five fits and three withheld checks around Saint-Bernard, Henri-Beraldi, Montoyol / Remusat and western Bayard. Former Rue Saint-Loup corresponds to Moutons rather than Jacques-Laffitte. The rejected candidate remains recorded with the corrected identification and is now withheld; the northeast Bayard boulevard opening is fitted. New check errors are Saint-Bernard / Pouzonville 32.5 to 14.5 m, Perigord / Remusat 30.7 to 12.4 m, and Bayard / Moutons 75.7 to 31.1 m (mean 46.3 to 19.3 m). The two close Henri-Beraldi fits use explicit smoothing 500 instead of 4: forcing both exactly compressed the area near Saint-Sernin below the existing Jacobian limit. Their actual residuals remain in the generated report. Later Alsace-Lorraine street cuts are not substituted for historical intersections.

The Terre-Cabade refinement adds four fitting observations: the main gateway, the southwest wall / Gloire corner, Cimetiere / Saint-Bertrand / Compans, and Colonne / Saint-Sylve. One withheld Cimetiere / Saint-Paul / Gazan observation improves from 159.2 m to 4.1 m against the frozen 40-anchor field. The entrance reference is OSM node 1828807375 at the junction of avenue way 23148223 and cemetery boundary way 16299793. The southwest corner is manually inspected on IGN and has 8 m annotation uncertainty. The central drawn monument and unverified northern extensions are excluded. The preserved gateway is independently identified by the [Ministry of Culture, PA31000114](https://pop.culture.gouv.fr/notice/merimee/PA31000114). These controls validate the approaches and entrance, not every internal grave path.
