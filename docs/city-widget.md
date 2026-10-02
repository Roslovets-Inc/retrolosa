# City widget

The widget keeps the population estimate and shows up to three most recent curated milestones at or before the selected calendar year. It is a selection of historical landmarks, not a complete event chronology. Future events are hidden. Clicking an icon toggles an inline description with a primary source link; Escape closes it. A detail disappears when its event is outside the current selection.

The twelve milestones are the Visigothic capital (418), siege (1218), university (1229), Black Death (1348), great fire (1463), religious violence (1562), plague (1628–1631), canal inauguration (1681), railway station (1856), flood (1875), Latécoère aviation industry (1917) and metro (1993). Source links and original French summaries are stored in `src/city-events.ts`;
`src/locales/en.json` and `fr.json` provide the displayed titles and summaries. The canal description distinguishes its inauguration from its full opening to traffic in 1684. All sources consulted on 2026-10-01.

The siege is anchored to 1218, while its description includes 1217–1218; the later plague is anchored to its start in 1628. Crossed swords mark armed and religious conflict; a skull marks plague mortality. CHU Toulouse’s historical account estimates 15–30% mortality for the Black Death through 1350 and about 10,000 deaths out of 50,000 inhabitants over 1628–1631. These are explicitly approximate retrospective estimates, not annual counts or deductions from the population widget. The 1562 account uses the municipal archives’ January 2022 dossier, page 2, and the city’s historical overview. No death count is claimed for either conflict. These milestones do not change population anchors or attribute every interpolated decline to a disaster; the series limitations remain in [population.md](population.md).

On phones, the widget starts 14 px below the safe-area-aware header. Population
stays visible; the localized “Historical milestones” / “Repères historiques” button expands or collapses the
milestones, initially collapsed. Desktop milestones remain visible. Collapsing
clears the selected event detail.

## Built-up area

The requested metric is the built-up area of Toulouse, with only verified estimates. No compatible dated series was established in this research, so no area figure is displayed yet.

- [Musée Saint-Raymond](https://saintraymond.toulouse.fr/le-rempart-romain-de-toulouse/) gives 90 ha within the Roman enclosure. This includes unbuilt spaces and is not a built-up area measurement.
- [Municipal heritage page](https://metropole.toulouse.fr/sortir/patrimoine/restaurer-le-patrimoine) gives the protected historic site's area, not a historical built-up area.
- [AUAT 2012](https://www.aua-toulouse.org/wp-content/uploads/2012/11/pdf_4p-2010_11_extention_aire_urbaine_ligth.pdf) provides urbanized area for the urban pole and SCoT (1990–2008). These boundaries cover multiple communes and cannot be presented as the city's built-up area alongside commune population.

Do not substitute administrative area, raster extent, enclosed area or metropolitan urbanized area for this metric. Add a figure only after checking its date, boundary and land-cover definition; do not interpolate across incompatible definitions.
