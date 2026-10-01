# Map reading orientations

Audit of all eleven historical layers, 2026-10-01. Existing rasters were inspected without regenerating assets. Positive MapLibre bearings rotate the displayed sheet counterclockwise, cancelling its clockwise tilt in the north-up view.

| Layer          |           Measured reading bearing | Preset |
| -------------- | ---------------------------------: | -----: |
| Late Antiquity |                             −1.16° |     0° |
| XIII century   |                             −1.01° |     0° |
| 1550           |                             −1.23° |     0° |
| Tavernier 1631 |                       about 84.38° |    84° |
| 1680           |            north-up reconstruction |     0° |
| Saget 1777     |                             53.22° |    53° |
| 1830           |            north-up reconstruction |     0° |
| Jourdan 1860   |                              7.80° |     7° |
| Flood 1875     |                       about −0.53° |     0° |
| Laffont 1904   |                              5.30° |     7° |
| Aerial 1954    | north-up IGN WMTS; no sheet legend |     0° |

For affine image layers, measure the top edge from the first to second corner in `src/*json`, projecting latitude into Web Mercator: `atan2(-ΔmercatorY, Δlongitude)`. Source sheets have horizontal titles and legend lines. For the already warped 1631 and 1875 rasters, an affine least-squares fit from `old` to `ref` over the `fit` control points in `data/*-control-points.json` gives the overall horizontal-axis angle: `atan2(a[0,1], a[0,0])`. Their nonlinear warps mean one rotation cannot straighten every line simultaneously. The 1680 and 1830 rendered overviews were visually checked; 1954 uses the existing north-aligned WMTS tile grid rather than a rotated sheet.

Four presets are needed to retain the two strongly rotated sheets and the small common tilt of 1860/1904. The shared 7° preset leaves at most about 2° of title tilt in those two sheets. Values near −1° are grouped with north. The cycle is fixed, independent of enabled epochs, with one compass button showing the selected bearing. Both map cameras remain synchronized during animation; sharing stores the target preset. Overview navigation preserves it. Arbitrary URL bearings fall back to north.
