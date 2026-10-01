# Population affichée

Le compteur représente la ville historique, puis la commune de Toulouse, et non la métropole. Les périmètres et méthodes varient selon les périodes : cette série donne des ordres de grandeur, pas une mesure à territoire constant.

Les valeurs sont interpolées linéairement par année civile, indépendamment des cartes activées, puis arrondies au millier. Les baisses sont conservées. Au-delà de 2023, la dernière population connue est maintenue et sa date est affichée ; aucun chiffre futur n’est prédit.

## Repères et sources

- Antiquité : environ 20 000 habitants selon les [Archives de Toulouse](https://archives.toulouse.fr/place-saint-etienne/). Le repère 450 transpose cette estimation générale à la carte de l’Antiquité tardive ; ce n’est pas un recensement du Ve siècle. Faute de repères intermédiaires, le plateau jusqu’à 1200 ne reconstitue pas les variations du haut Moyen Âge.
- Vers 1200 : environ 20 000 habitants ; vers 1330 : 35 000. [Mémoire universitaire, p. 86 et références](https://dante.univ-tlse2.fr/files/original/edf94af1247a0be3c61a1f1ef12783f897ae675f.pdf). Le XIIIe siècle est interpolé entre ces repères.
- Vers 1400 : 24 000 habitants, [Archives, exposition Toulouse au Moyen Âge](https://www.archives.toulouse.fr/documents/10184/75383/texte_livret_expo_moyen%2B%C3%A2ge.pdf/af46eef7-904e-45f3-9254-a21684d1363e).
- XVIe siècle : environ 50 000 ; XVIIe : 40 000. Les dates 1550 et 1650 sont des repères représentatifs, [Société archéologique du Midi de la France](https://www.societearcheologiquedumidi.fr/_samf/memoires/t_73/237-250_Ch.Peligry.pdf).
- 1695 : 43 000 ; 1790 : au moins 64 000, [Jean-Luc Laffont, 1998](https://www.persee.fr/doc/hes_0752-5702_1998_num_17_3_1997). Les estimations d’Ancien Régime sont discutées ; la rupture avec le recensement de 1793 ne mesure donc pas seulement une baisse réelle.
- 1793–1962 : sélection de recensements dans le [tableau démographique de Toulouse](https://fr.wikipedia.org/wiki/Toulouse#Démographie), attribué à EHESS/Cassini. Valeurs conservées dans `src/population.ts` avant arrondi.
- 1968–2023 : [INSEE, dossier communal](https://www.insee.fr/fr/statistiques/2011101?geo=COM-31555), dont 514 819 habitants en 2023.

Les interpolations ne représentent pas les effets annuels des épidémies, guerres ou migrations. Sources consultées le 1er octobre 2026.
