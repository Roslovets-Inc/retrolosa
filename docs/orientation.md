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
| Jourdan 1860   |                              5.60° |     0° |
| Flood 1875     |                       about −0.53° |     0° |
| Laffont 1904   |                              4.52° |     0° |
| Aerial 1954    | north-up IGN WMTS; no sheet legend |     0° |

For affine image layers, measure the top edge from the first to second corner in `src/*json`, projecting latitude into Web Mercator: `atan2(-ΔmercatorY, Δlongitude)`. Source sheets have horizontal titles and legend lines. For the already warped 1631 and 1875 rasters, an affine least-squares fit from `old` to `ref` over the `fit` control points in `data/*-control-points.json` gives the overall horizontal-axis angle: `atan2(a[0,1], a[0,0])`. Their nonlinear warps mean one rotation cannot straighten every line simultaneously. The 1680 and 1830 rendered overviews were visually checked; 1954 uses the existing north-aligned WMTS tile grid rather than a rotated sheet.

The compass toggles only between north and the current sheet's reading orientation: 84° for 1631 or 53° for 1777. All other layers use north, including the small tilts of 1860/1904. The timeline remains available with every comparison tool. During a timeline crossfade, the dominant sheet is the reference, switching to the emerging sheet at the midpoint of the enabled calendar interval. The modern endpoint participates in this choice.

The selected camera bearing persists through timeline, epoch-selection and opacity changes. Only pressing the compass changes it: a rotated view returns to north; a north-up view adopts the dominant sheet's reading angle. The compass is disabled only when both the selected bearing and the current sheet's reading angle are zero, so a rotated north-aligned sheet can always be reset. Temporary hold/space comparisons preserve the camera. Both map cameras remain synchronized during animation; sharing stores the target bearing and overview navigation preserves it. Legacy 7° links and arbitrary URL bearings fall back to north.

État-major 1848 uses the north-up IGN WMTS layer with a dense local street correction. No additional reading angle is needed. The 1860 and 1904 bearings above describe the preserved affine sheet frame; their complete sheet boundaries remain fixed during the local warp.
