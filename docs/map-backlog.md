## Integrated 1860 and 1904 plans — 2026-10-01

- **Circa 1860**: Justin Jourdan / Prosper Rivière, Toulouse Municipal Archives,
  20 Fi 66. [Official scan](https://www.flickr.com/photos/archives-toulouse/24480515944/),
  public domain according to the Flickr description. Original 4117 × 3152 pixels;
  rendering 4096 × 3136. Inset maps, monument views and tables are preserved.
  The document combines completed changes and proposed alignments.
- **1904**: Léon Laffont / Pierre Rouy, Pagès et Carrère, 20Fi57.
  [Official record and illustration](https://archives.toulouse.fr/plans-anciens/#plan-laffont).
  The original file is identified by the WordPress metadata for illustration 3100:
  [Complete JPEG](https://archives.toulouse.fr/wp-content/uploads/sites/18/2026/09/20Fi57.jpg),
  3768 × 4592 pixels, rendering 3361 × 4096. The bottom reads “Tirage de 1904”.
  The grid, title and margins are preserved. The Amidonniers bridge is a proposal.
  The page does not specify a license for this illustration; attribution does
  not replace reuse terms.

Both affine alignments use Saint-Sernin, Saint-Étienne and Pont Neuf.
Three separate checks at Taur, Saint-Pierre-des-Cuisines and Dalbade measure
**11.8 / 24.9 / 41.9 m** (1860) and **25 / 47.8 / 24.9 m** (1904), respectively.
These checks cover the centre; suburbs are not validated.
Configurations are in `data/jourdan-1860-control-points.json` and
`data/laffont-1904-control-points.json`; explicit generation uses
`scripts/build-city-plans.py` (numpy and Pillow). No automatic downloads.

## Integrated Saget plan — 2026-10-01

The **1777** plan, Toulouse Municipal Archives **II 686**, is integrated between
1680 and 1830. The complete colour scan (5906 × 4047 pixels), tables and legend
are preserved. Official source:
[Municipal Archives](https://www.flickr.com/photos/archives-toulouse/25111159875/),
public domain. Drawing by Joseph Marie de Saget, engraving by Pierre Gabriel Berthault.

The displayed raster is 4096 × 2807 pixels; the original JPEG remains accessible.
Affine alignment uses Saint-Sernin, the western portal of Saint-Étienne and
the right-bank end of Pont Neuf. Two separate checks give 36.2 m at
Saint-Pierre-des-Cuisines and 58.8 m at the left-bank end of Pont Neuf. These are
local checks, not an overall accuracy measurement. Manual annotations and document
distortions limit street-by-street comparison.
Configuration: `data/saget-1777-control-points.json`; explicit generation:
`scripts/build-saget-1777.py` (numpy and Pillow). No automatic downloads.

# Map backlog — review of 2026-09-29

Already integrated: **thirteenth-century** reconstruction (OpenEdition, figure 6),
**1631** Tavernier plan (approximate alignment), interpreted **1680 and 1830**
cadastres, **1875** flood plan, **1954** aerial photography and current basemap.
These are excluded from the backlog.

This ranking estimates value for our application: a new period, street-level
legibility and required work. A scan's existence proves neither its accuracy nor
the availability of a reusable georeferenced service. The IGN services below still
need checking over Toulouse before integration.

## Proposed priorities

| Rank | Source                                            | Value for the site                                     | Estimated effort and next check                                                                                                |
| ---- | ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 2    | **1965–1980 — IGN orthophotography**              | Fill the large gap between 1954 and today.             | Low if local coverage is suitable: check Toulouse tiles and each photograph's actual date. Do not invent a single “1970” date. |
| 4    | **1808 — changes since 1789**                     | Explore transformations around the Revolution.         | Medium to high: check the legend and distinguish existing features, changes and proposals before alignment.                    |
| 5    | **1880–1881 — Perrossier, Toulouse surroundings** | Extend exploration into suburbs and surrounding areas. | High: multiple sheets, assembly and seam validation; chiefly useful outside the centre.                                        |
| 7    | **Cassini — eighteenth century**                  | Countryside, roads and villages around Toulouse.       | Low to medium if the service is suitable; check date and coverage. Poorly suited to central street comparison.                 |
| 8    | **2000–2005 — IGN orthophotography**              | A recent stage before the current basemap.             | Low if local coverage and dates are established. Lower priority than a missing older period.                                   |

For the next drawn historical map, examine **1808**. For potentially quick
integration, check **1965–1980** first. These recommendations are our judgment,
not a guarantee of source quality.

## Other confirmed scans in reserve

### New ancient and medieval sources — review of 2026-09-30

The **12 drawings from Quitterie Cazes's study** are collected locally and inventoried
in the [assembly proposal](openedition-medieval-layers.md) and
`data/openedition-3296-catalog.json`. These are scholarly reconstructions,
distinct from scans of contemporary historical plans above.

First candidate: **Toulouse in the thirteenth century, figure 6**, then Late Antiquity
(1 and 10), then the twelfth-century Saint-Sernin borough (9 and phases of 2/3).
Figures 7/8 document inherited orientations in the 1550 parcel layout; they are
not an ancient map. Figure 12 has a dating contradiction to resolve.

Late Antiquity figure 1 is integrated locally with its complete legend and a numeric
450 anchor used only for navigation. Thirteenth-century figure 6 is now integrated
into the site with affine alignment and source links. Parcel boundaries from figures
7 and 8 are also assembled into a local “1550 · Héritages du parcellaire” layer.
Other candidates require alignment, masks and, for multiphase drawings, extraction
of contemporary elements. **Permission to republish illustrations and adaptations
still needs to be obtained**: the OpenEdition text license does not cover images.
Prototype attribution is not permission.

The official Archives album also lists **1650, 1677, 1774, 1815, 1825, 1838,
1843, 1848, 1863 and 1872**. All still need preparation and georeferencing.
Choose one representative map per nearby period after inspecting scans.

The **1680 engraved plan by Jouvin de Rochefort** is also available: it differs
from our 1680 cadastral rendering, so it is a source variant rather than a new epoch.

The **1772 plan by Dupain-Triel and de La Lande** is documented in the Archives
selection. It is an alternative to 1774/1777 for visual comparison.

The IGN **1950–1965** series has low priority because Toulouse 1954 is already
available. **2011–2015 and 2016–2020** are additional recent options to consider
only if they show an interesting local change.

**1900/1910/1941** are not ready candidates here: a precise record, scan and coverage
must still be identified. An album title of “1515–1941” does not qualify every map
it contains.

## Verified sources

- [Official Archives album: scans and dates](https://www.flickr.com/photos/archives-toulouse/albums/72157664247082820/).
- [Archives selection of historical plans](https://archives.toulouse.fr/histoire-de-toulouse/patrimoine-urbain/plans-anciens).
- [Plans from 1772 to 1847](https://archives.toulouse.fr/histoire-de-toulouse/patrimoine-urbain/plans-anciens/plans1772_1847?inheritRedirect=true).
- [IGN: available periods and Remonter le temps operation, March 2026](https://www.ign.fr/actualites/remonter-le-temps-les-archives-photographiques-et-cartographiques-de-lign-souvrent-encore-et-toujours-plus-vous).
- [IGN: 1965–1980 WMTS/WMS service, March 2026 updates](https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2026-03-mises-a-jour/).

For every integration, record source, actual date, coverage, reuse terms and attribution.
For scans, retain control points, compare transformations, test independent points and
document limits. Reuse the 1875 tooling, but never its points or deformation.

État-major is now integrated as epoch 1848, verified against the six source sheets in the IGN catalogue. See [sources.md](sources.md#état-major-1848--verified-ign-catalogue-date).
