# Ancient and medieval reconstructions — OpenEdition 3296

Inventory dated 2026-09-30. All 12 original illustrations were downloaded and checked.
They remain in `.local/openedition-3296/originals/`, outside the site's public resources.
A local gallery is available at `.local/openedition-3296/index.html`; the reproducible
manifest is in `data/openedition-3296-catalog.json`.

`.local/` is ignored by Git: these files and the gallery may be absent from a new clone.
Preserve originals separately during a transfer if regeneration is planned; their
absence does not block the site build using assets already tracked in `public/`.

## Source

### Twelfth-century borough layer — 2026-10-01

Figure 9 is integrated as `1195`, labelled **XIIe**, with partial coverage of the
Saint-Sernin borough. The complete diagram retains its legend and growth phases
circa 1107, circa 1150, after 1150 and after 1191. This is a multiphase analysis,
not a single-year city state. Its fossil parcel background derives from the
reconstructed 1550 cadastre. 1195 is only an ordering anchor.

Three manually matched landmarks transfer alignment through figure 6: Saint-Sernin,
Saint-Pierre-des-Cuisines and the first Arnaud-Bernard gate. Withheld La Porterie and
Matabiau gates disagree by 5.1 and 5.3 metres between diagrams. These checks measure
inter-diagram agreement, not independent geographic or historical accuracy.
Configuration: `data/openedition-12c-control-points.json`; explicit generator:
`scripts/build-openedition-12c.py` (numpy and Pillow). Original checksums are verified.

Figure 11 is linked as a supplementary castle document, without an unvalidated map
overlay. Castle alignment and phase-separated composition remain future work.
The unresolved illustration reuse terms also apply here. No deployment was requested.

Alignment correction on 2026-10-01: the XII-century Saint-Sernin crossing is
reannotated at (675, 380) on the 1200-pixel drawing and anchored directly to IGN
Plan v2 zoom-17 cached reference tiles, at mosaic pixel (272, 232), corresponding
to (653.125, 495.3125) in the shared annotation reference. The affine transfer is
translated to this anchor; it is not refitted through near-collinear direct points,
which amplified small annotation errors at the edges. Current checks supersede the
initial figures above: Saint-Pierre-des-Cuisines versus IGN 15.9 m; La Porterie and
Matabiau versus figure 6, 19.1 and 19.8 m. Remaining disagreement is explicit.

[Quitterie Cazes, “Toulouse au Moyen Âge : les pouvoirs dans la ville”](https://books.openedition.org/psorbonne/3296),
in _Marquer la ville_, 2013, pp. 341–366. Drawings by F. Callède, based on research
into medieval Toulouse, notably the collective programme and the synthesis edited
by Jean Catalo and Quitterie Cazes in 2010.

These documents are **recent scholarly reconstructions**, combining known elements
and proposals. They are not maps drawn in the period represented. Several use the
1550 parcel layout as an analytical base. The reference background, older remains
and later elements are not all contemporary with the subject.

## Inventory of the 12 figures

### Saint-Pierre-des-Cuisines phase detail — 2026-10-01

Figure 3 now enriches the XII-century layer inside the existing Saint-Sernin region,
without adding another epoch or claiming wider coverage. Hand-reviewed building
regions and legend colours retain red phases circa 1100/1150 and the light-green
phase circa 1180. Yellow 1050, teal Late Middle Ages and grey later elements are
excluded. The retained phases remain a comparative analysis, not evidence that all
walls coexisted in 1195; missing older wall segments are not reconstructed.

A similarity fit uses the surviving west facade midpoint and eastern main apse end
on cached IGN Plan v2 zoom-17 tiles (66057–66059, 47859–47861). Withheld northwest
and southwest nave corners disagree by 3.8 and 7.0 m. These manual annotations on
the reference map validate only this small footprint. A tight replacement mask
removes figure 9's coarse church symbol beneath the detail, retaining surrounding
borough streets. Figure 3's complete original and phase legend are linked in sources.
Configuration remains in `data/openedition-12c-fragments.json`, with the same two-step
explicit generator workflow. Raster revision 4 avoids stale browser imagery.

### Three-fragment XII-century composition — 2026-10-01

The current renderer uses a single transparent composite of figures 9, 4 and 11.
The preceding borough-only records describe earlier preparation stages. Figure 9
keeps its established corrected alignment; its manually bounded map region excludes
the page legend and margins. Its full original and multiphase legend remain linked.

Figure 4 uses a similarity fit between the surviving cathedral's west portal and
eastern choir end on cached IGN Plan v2 zoom-17 reference tiles. Withheld southwest
nave and north choir corners differ by 4.9 and 7.8 m. These building checks do not
validate the entire historical quarter. Hand-reviewed regions plus legend colours
retain Romanesque red features, yellow canonical residences and the purple episcopal
palace; pale-yellow XIII-century extension, grey later elements and contemporary
cathedral/background linework are excluded. This is phase extraction, not a complete
reconstruction of the missing Romanesque cathedral. The original is linked in full.

Figure 11 retains the late-XII-century castle, walls, moats, uncertain gate and possible
access labels inside a bounded fragment. Its approximate placement uses the castle
symbol in figure 6, the north arrow and 50-metre scale. **No independent geographic
check validates the castle footprint**; a symbol centre is not a survey control point.
Do not claim street-level accuracy for it. Figure 12 is not used as a historical layer.

Inputs and masks: `data/openedition-12c-fragments.json`. Explicit generation requires
`scripts/build-openedition-12c.py` followed by `scripts/compose-openedition-12c.py`.
The composer verifies source checksums, aligns fragments in Web Mercator and preserves
transparent gaps in the shared WebP. Originals are copied to `public/openedition-12c`;
after preparation, generators can use those tracked copies if `.local` is absent.
Re-running the composer alone against an already composed raster is unsupported;
always run the borough generator first. No automatic downloads, raster regeneration
in the web build, or deployment are introduced. Illustration reuse terms remain open.

| No. | Subject                                   | Usable dating                                                                                                  | Proposed use and precautions                                                                                                                                               |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Toulouse at the end of Antiquity          | Late Antiquity; Early and Late Roman Empire remains distinguished                                              | General ancient reference plan, including the Gothic palace. Not a uniform third- or fourth-century snapshot. Separate remains from reconstructed street axes.             |
| 2   | Saint-Sernin and its enclosure            | Twelfth century, fourteenth-century enlargement, Romanesque and late medieval buildings                        | Detail for medieval layers; extract phases and exclude later elements from an earlier-period rendering.                                                                    |
| 3   | Saint-Pierre-des-Cuisines                 | 1050, circa 1100, 1150, 1180, Late Middle Ages                                                                 | Building-phase series. Do not combine all walls as though they coexisted.                                                                                                  |
| 4   | Saint-Étienne canonical quarter           | Romanesque state, thirteenth-century extensions, later elements                                                | Twelfth-/thirteenth-century detail after phase separation; the drawing also includes later elements.                                                                       |
| 5   | Daurade monastery                         | View circa 1760; phases in 1050, first and second halves of the twelfth century, Late Middle Ages              | Standalone fragment circa 1760. For medieval use, reuse only explicitly dated phases with verified context.                                                                |
| 6   | Toulouse in the thirteenth century        | Thirteenth century, without a single year                                                                      | Best first general medieval plan. The legend distinguishes known and proposed locations; preserve that distinction.                                                        |
| 7   | Ancient orientations in the parcel layout | Reconstructed 1550 cadastre                                                                                    | Analysis of ancient inheritance, not a map of ancient parcels. Thematic complement to figure 8.                                                                            |
| 8   | Other parcel-layout orientations          | Reconstructed 1550 cadastre; layouts attributed to the Middle Ages                                             | Analysis of medieval inheritance. Potential combination with 7 after checking their shared background.                                                                     |
| 9   | Formation of the Saint-Sernin borough     | Circa 1107, circa 1150, after 1150, extension after 1191; 1550 cadastral base                                  | Best basis for a northern Toulouse fragment in the twelfth century. Separate growth phases and check depicted enclosures.                                                  |
| 10  | Gothic palace, Saint-Pierre and gallery   | Fifth century                                                                                                  | Local ancient detail to connect to 1. Cadastral context supports alignment, rather than representing fifth-century streets.                                                |
| 11  | Narbonnais gate and castle with moats     | Late twelfth century                                                                                           | Southern detail of comital power. Possible access routes and the uncertain gate remain hypotheses.                                                                         |
| 12  | Royal palace and Salin area               | Contradictory dating: caption says late twelfth century; paragraph 23 says after 1271, works completed in 1287 | Late-thirteenth-century candidate, **to be confirmed**. Do not automatically combine it with 11. Check neighbouring institutions before dating the entire drawing to 1287. |

## Proposed grouping

The five research periods discussed in the chapter (400–1050, 1050–1190, 1190–1271,
1271–1350, 1350–1480) are useful categories. The illustrations alone cannot produce
five complete city states.

| Proposed group                       | Sources                                                   | Coverage and presentation                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Late Antiquity**                   | 1 + detail 10                                             | General reconstruction and fifth-century detail. Show phases/hypotheses; do not invent an exact year for the whole plan.                                             |
| **Eleventh–twelfth centuries**       | 9 + phases of 2, 3, 4, 5; 11 for the late twelfth century | Discontinuous set: Saint-Sernin borough, religious centres and castle. Circa 1150 and late-twelfth-century versions require phase extraction and persistence checks. |
| **Thirteenth century**               | 6 + compatible phases of 2, 3, 4; 12 conditionally        | General plan enriched with local details. Reserve the royal palace for a late-thirteenth-century variant after resolving its date.                                   |
| **Fourteenth–fifteenth centuries**   | Late phases of 2, 3, 5, possibly 4 after inspection       | Local fragments only. “Late Middle Ages” supplies no precise year. No sufficiently documented standalone general layer yet.                                          |
| **1550 — parcel-layout inheritance** | 7 + 8, context from 9                                     | Thematic layer separate from the main timeline: orientations describe inheritance, not a complete 1550 state.                                                        |
| **Circa 1760 — Daurade**             | Complete 5                                                | Small standalone fragment for comparing the former monastery with the current quarter.                                                                               |

## Preparation method

1. **Identify historical content.** Retain originals; separately annotate buildings,
   streets, enclosures, phases and hypothetical areas. Extract legends and cadastral
   backgrounds from the historical rendering while retaining them for checking.
   Automatic colour selection alone is insufficient: colours change meaning between
   drawings and black lines span several phases.
2. **Align each document in a shared reference frame.** Use ground footprints of
   surviving buildings and identifiable cadastral boundaries. Start with an affine
   transformation; test a more complex one only if residuals justify it. Maps 7 and 8
   have matching dimensions and an apparently shared background: measure correspondence
   before applying shared alignment. Do not use the distorted 1631 plan as reference.
3. **Check results.** For neighbourhood plans, find 4–8 points distributed across the
   extent and reserve independent points. For an isolated building, check footprint
   corners against a reliable survey. Measure errors in metres; accept accuracy suited
   to resolution and reconstruction uncertainty. Compare fragment interiors and edges
   separately.
4. **Create dated objects and coverage masks.** Use GeoJSON for vectorized phases,
   with source, date interval, certainty and figure identifier; use masked rasters for
   retained imagery. Intervals describe evidence, not invented construction dates.
   Areas without information stay transparent. A building's absence from a diagram
   must not imply proof of its historical absence.
5. **Compose by period.** The general plan supplies context; validated details take
   priority within their own masks. Resolve contradictions before merging, without
   forcing incompatible outlines together. Generate shared tiles after validation.
   MapLibre supports transparent fragments in a shared visible set and high-zoom vector details.
6. **Adapt the timeline.** Use period labels (“XIIIe siècle”, “vers 1150”), a
   “Reconstruction” label and coverage indication. Graphical transitions must not
   simulate documented year-by-year evolution. Keep each original illustration
   accessible with its legend.

## Recommended implementation order

1. **Thirteenth century, figure 6 alone**: greatest immediate value, general coverage,
   relatively simple alignment and masking. This is an estimate before measuring points.
2. **Late Antiquity, 1 + 10**: major historical change; additional separation of remains,
   reconstruction and reference background.
3. **Twelfth-century Saint-Sernin borough, 9 + phases of 2/3**: useful for observing
   growth; more demanding phase extraction.
4. **Narbonnais/Salin area, 11 then 12**: compare comital and royal power, subject to
   dating 12 and aligning small fragments well.
5. **Saint-Étienne and Daurade**: local enrichment; Daurade circa 1760 can be a separate fragment.
6. **1550 parcel analysis, 7 + 8**: useful for explaining ancient traces, presented
   as an explanatory theme.

## Rights and original-image quality

The footer states that the OpenEdition Books license covers text only; illustrations
are all rights reserved unless stated otherwise. No separate license permitting
publication was identified for these 12 drawings. **Local collection does not authorize
publishing them on the site**, or publishing adaptations traced from them. Before
public integration, obtain permission from rights holders and, ideally, vector files
or alignment data from the research programme.

Available JPEGs range from about 900 pixels for some details to 2,000–2,660 pixels
for general plans. They support project evaluation but do not guarantee fine reading
at every zoom. The page supplies no coordinate system or control points. Vector
originals would improve precision and avoid artificial image enlargement.

The local gallery and catalogue are research documents. At the user's request,
**figure 6 is now integrated into the site** under “XIIIe s.”, with attribution
and links to the source and complete drawing. The numeric 1250 anchor serves only
timeline ordering and links; it is not a precise date.

Affine alignment uses three surviving landmarks (Saint-Sernin, Saint-Étienne west
portal, Dalbade nave). Saint-Pierre-des-Cuisines is reserved for independent checking:
3.2 m error, without a citywide guarantee.
Reproducible configuration: `data/openedition-13c-control-points.json`;
explicit preparation: `scripts/build-openedition-13c.py`. Rendering preserves
the complete source drawing, original legend and quarters outside the enclosure,
without cropping or transparent areas. The prepared WebP is about 1.1 MB;
the original is about 1.33 MB.

### Late Antiquity layer — figure 1, 2026-10-01

Figure 1 is integrated locally with the compact “Ve” timeline and epoch-selection
label; its context remains “Antiquité tardive”. The numeric 450 anchor serves only
timeline ordering and links; the source does not date the drawing to a precise year.
The plan preserves its full extent and legend, distinguishing Early Empire remains,
Late Empire remains and proposed ancient street-axis reconstructions. Churches
and the parcel background provide references and do not all depict a Late Antiquity state.

Affine alignment uses reference footprints of Saint-Sernin, Saint-Étienne and Dalbade,
matched to figure 6. The independent Saint-Pierre-des-Cuisines check gives 4.4 m,
without an accuracy guarantee elsewhere.
Configuration: `data/openedition-antiquite-control-points.json`; explicit preparation:
`scripts/build-openedition-antiquite.py`. The original's SHA-256 is checked before
generation. No publication was performed.

### 1550 layer — assembly of figures 7 and 8, 2026-10-01

The “1550 · Héritages du parcellaire” layer is integrated locally into epoch selection
and the timeline. It retains all of figure 8 and adds figure 7's red parcel boundaries.
Figure 7's archaeological background and specific annotations remain accessible in
its original; they are not overlaid on the medieval background. An explanation of
both colours is added below the drawing without cropping the plan or legend.

Both scans are 1999 × 2482 pixels. Local comparison of the three churches' patterns
in achromatic channels gives translations (-5, -24), (-6, -23) and (-6, -24) pixels,
with correlations of 0.91–0.95. The mean translation from figure 7 to figure 8 is
(-5.67, -23.67) pixels; maximum deviation across these three landmarks is 0.75 pixel.
This does not prove perfect agreement throughout the plan.

Figure 8's affine alignment uses the same geographic landmarks as figure 6.
Saint-Pierre-des-Cuisines, excluded from fitting, gives a 1.8 m error. Annotation
is manual; this figure does not guarantee accuracy elsewhere. 1550 dates the
reconstructed cadastral base, not every depicted object. The timeline shows a
graphical transition, not a historical reconstruction of intermediate years.

Configuration: `data/openedition-1550-control-points.json`; explicit generation:
`scripts/build-openedition-1550.py`. Original SHA-256 checksums are verified before
generation. Resources are in `public/openedition-1550/`. No publication was performed
for this integration.

### Provenance and rights verification, 2026-09-30

“All rights reserved” does not identify OpenEdition as the rights holder. Captions
credit **F. Callède**; the credit embedded in general plan 6 mentions F. Callède,
Inrap and the PCR “Toulouse au Moyen Âge”.
The [BnF bibliographic record](https://catalogue.bnf.fr/ark:/12148/cb42328162f)
names **Fabien Callède** among the 2010 synthesis authors.
The [official Inrap atlas](https://multimedia.inrap.fr/atlas/Grand-Toulouse/sites/3237/Le-Barricou)
also credits Fabien Callède for other drawings. These establish provenance and the
probable creator but do not prove the current allocation of economic rights between
the illustrator, institution and publishers.

The [Éditions de la Sorbonne recommendations](https://www.editionsdelasorbonne.fr/asset_ref/980f4a2574399b4f2a3d1665fff748924b9c81ce3ae7367e/recommandations_comite_2025.pdf)
explicitly distinguish individuals and organizations holding illustration rights from
the publisher. It would therefore be incorrect to conclude that the platform, or
automatically the chapter publisher, owns the maps.

No open permission specific to these 12 drawings was found in consulted sources.
Their ancient or medieval subject does not make them old documents: these are
contemporary drawings. The holder authorized to permit our use remains **unconfirmed**,
rather than “OpenEdition” by default. Attribution and site links do not constitute
a license. The user requested publication on 2026-09-30 after this verification;
that request does not establish rights-holder permission.

To resolve this uncertainty, contact the chapter author or Inrap, citing Fabien
Callède and the PCR, and ask who can authorize reproduction and map adaptations:
georeferencing, cropping, tiling and overlay on a public website.
[Éditions de la Sorbonne provides a reproduction-request contact](https://www.editionsdelasorbonne.fr/store/page/90/foreign-rights):
marie.brunet@univ-paris1.fr; they can confirm their rights scope or refer to the
appropriate contact. No message has been sent.
