# Displayed population

The counter represents the historical city, then the commune of Toulouse, rather than
the metropolitan area. Boundaries and methods vary by period: this series provides
orders of magnitude, not measurements over a constant territory.

Values are interpolated linearly by calendar year, independently of enabled maps,
then rounded to the nearest thousand. Declines are preserved. Beyond 2023, the latest
known population is retained and its date is displayed; no future figures are predicted.

## Anchors and sources

- Antiquity: approximately 20,000 inhabitants according to the [Toulouse Archives](https://archives.toulouse.fr/place-saint-etienne/). The 450 anchor applies this general estimate to the Late Antiquity map; it is not a fifth-century census. Without intermediate anchors, the plateau through 1200 does not reconstruct early medieval variations.
- Around 1200: approximately 20,000 inhabitants; around 1330: 35,000. [University dissertation, p. 86 and references](https://dante.univ-tlse2.fr/files/original/edf94af1247a0be3c61a1f1ef12783f897ae675f.pdf). The thirteenth century is interpolated between these anchors.
- Around 1400: 24,000 inhabitants, [Archives, Toulouse in the Middle Ages exhibition](https://www.archives.toulouse.fr/documents/10184/75383/texte_livret_expo_moyen%2B%C3%A2ge.pdf/af46eef7-904e-45f3-9254-a21684d1363e).
- Sixteenth century: approximately 50,000; seventeenth century: 40,000. The dates 1550 and 1650 are representative anchors, [Société archéologique du Midi de la France](https://www.societearcheologiquedumidi.fr/_samf/memoires/t_73/237-250_Ch.Peligry.pdf).
- 1695: 43,000; 1790: at least 64,000, [Jean-Luc Laffont, 1998](https://www.persee.fr/doc/hes_0752-5702_1998_num_17_3_1997). Ancien Régime estimates are debated; the discontinuity with the 1793 census therefore reflects more than an actual decline.
- 1793–1962: selected censuses from the [Toulouse demographic table](https://fr.wikipedia.org/wiki/Toulouse#Démographie), attributed to EHESS/Cassini. Unrounded values are retained in `src/population.ts`.
- 1968–2023: [INSEE, commune profile](https://www.insee.fr/fr/statistiques/2011101?geo=COM-31555), including 514,819 inhabitants in 2023.

Interpolation does not represent annual effects of epidemics, wars or migration.
Sources consulted on 2026-10-01.
