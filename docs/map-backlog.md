# Cartes à ajouter — revue du 29 septembre 2026

Déjà intégrés : reconstruction du **XIIIe siècle** (OpenEdition, figure 6), plan Tavernier de **1631** (calage approximatif), cadastres interprétés de **1680 et 1830**, plan d’inondation de
**1875**, photographie aérienne de **1954**, fond actuel. Ils sont exclus du backlog.

Ce classement est une estimation pour notre application : intérêt d’une nouvelle
époque, lisibilité à l’échelle des rues et travail nécessaire. L’existence d’un
scan ne prouve ni sa précision ni l’existence d’un service géoréférencé réutilisable.
Les flux IGN ci-dessous restent à vérifier sur Toulouse avant intégration.

## Priorités proposées

| Rang | Source                                           | Intérêt pour le site                                                                 | Effort estimé et prochaine vérification                                                                                                                           |
| ---- | ------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **1777 — plan de Saget**                         | Nouvelle époque entre 1680 et 1830 ; ville avant les transformations du XIXe siècle. | Moyen à élevé : obtenir le meilleur scan, masquer les marges, sélectionner des points stables et valider le calage. Aucune annotation réutilisable confirmée.     |
| 2    | **1965–1980 — orthophotographies IGN**           | Compléter le grand intervalle entre 1954 et aujourd’hui.                             | Faible si la couverture locale convient : vérifier des tuiles de Toulouse et la date réelle de chaque prise de vue. Ne pas inventer un millésime unique « 1970 ». |
| 3    | **1860 — Jourdan et Rivière**                    | Étape intermédiaire entre 1830 et 1875.                                              | Moyen : scan et calage manuel ; comparer les points de contrôle indépendants.                                                                                     |
| 4    | **1808 — changements depuis 1789**               | Lire les transformations autour de la Révolution.                                    | Moyen à élevé : vérifier la légende et distinguer état existant, changements et projets avant le calage.                                                          |
| 5    | **1880–1881 — Perrossier, environs de Toulouse** | Étendre l’exploration aux faubourgs et aux environs.                                 | Élevé : plusieurs feuilles, assemblage et validation des raccords ; intérêt surtout hors du centre.                                                               |
| 6    | **État-major — série 1820–1866**                 | Contexte territorial du XIXe siècle.                                                 | Faible à moyen si le flux convient ; identifier la feuille et sa date. Détail urbain à comparer avec notre cadastre de 1830.                                      |
| 7    | **Cassini — XVIIIe siècle**                      | Campagne, voies et villages autour de Toulouse.                                      | Faible à moyen si le flux convient ; vérifier date et couverture. Peu adapté à la comparaison des rues du centre.                                                 |
| 8    | **2000–2005 — orthophotographies IGN**           | Une étape récente avant le fond actuel.                                              | Faible si la couverture et les dates locales sont établies. Moins prioritaire qu’une époque ancienne manquante.                                                   |

Pour une prochaine carte ancienne dessinée, privilégier **1777**. Pour une
intégration potentiellement rapide, vérifier d’abord **1965–1980**. Ces deux
recommandations sont notre jugement, pas une garantie de qualité des sources.

## Autres scans confirmés, en réserve

### Nouvelles sources antiques et médiévales — revue du 30 septembre 2026

Les **12 dessins de l’étude de Quitterie Cazes** sont collectés localement et
inventoriés dans [la proposition d’assemblage](openedition-medieval-layers.md)
et `data/openedition-3296-catalog.json`. Ce sont des reconstructions scientifiques,
à distinguer des scans de plans d’époque ci-dessus.

Premier candidat : **Toulouse au XIIIe siècle, figure 6**, puis Antiquité tardive
(1 et 10), puis bourg Saint-Sernin au XIIe siècle (9 et phases de 2/3). Les figures
7/8 documentent des héritages du parcellaire de 1550 ; elles ne constituent pas
une carte antique. La figure 12 présente une contradiction de datation à résoudre.

La figure 1 de la fin de l’Antiquité est intégrée localement, avec sa légende
complète et un repère numérique 450 utilisé uniquement pour la navigation.
La figure 6 du XIIIe siècle est maintenant intégrée au site, avec
un calage affine et des liens de source. Les limites parcellaires des figures 7 et 8
sont également assemblées dans une couche locale « 1550 · Héritages du parcellaire ».
Les autres
candidats nécessitent un calage, des masques et, pour les dessins multiphases,
une extraction des éléments contemporains. **L’autorisation de republier les
illustrations et leurs adaptations reste à obtenir** : la licence du texte
OpenEdition ne couvre pas les images. L'attribution du prototype n'est pas une autorisation.

L’album officiel des Archives liste aussi **1650, 1677, 1774, 1815, 1825, 1838,
1843, 1848, 1863 et 1872**. Tous restent à préparer et à géoréférencer. On choisira
une seule carte représentative par période proche après inspection des scans.

Le **plan gravé de 1680 de Jouvin de Rochefort** reste également disponible :
il s’agit d’un document différent de notre rendu cadastral de 1680, donc d’une
variante de source, pas d’une nouvelle époque.

Le plan **1772, Dupain-Triel et de La Lande**, est documenté dans la sélection
des Archives. Il constitue une alternative à 1774/1777 à comparer visuellement.

La série IGN **1950–1965** est de faible priorité : nous avons déjà Toulouse 1954.
Les périodes **2011–2015 et 2016–2020** sont des options récentes supplémentaires,
à traiter seulement si elles apportent un changement intéressant localement.

Les dates **1900/1910/1941** ne constituent pas ici des candidats prêts : il faut
encore identifier une notice précise, le scan et sa couverture. Le titre d’un
album « 1515–1941 » ne suffit pas à qualifier chaque carte qu’il contient.

## Sources vérifiées

- [Album officiel des Archives : scans et dates](https://www.flickr.com/photos/archives-toulouse/albums/72157664247082820/).
- [Sélection des plans anciens des Archives](https://archives.toulouse.fr/histoire-de-toulouse/patrimoine-urbain/plans-anciens).
- [Plans de 1772 à 1847](https://archives.toulouse.fr/histoire-de-toulouse/patrimoine-urbain/plans-anciens/plans1772_1847?inheritRedirect=true).
- [IGN : périodes disponibles et fonctionnement de Remonter le temps, mars 2026](https://www.ign.fr/actualites/remonter-le-temps-les-archives-photographiques-et-cartographiques-de-lign-souvrent-encore-et-toujours-plus-vous).
- [IGN : service WMTS/WMS 1965–1980, mises à jour de mars 2026](https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2026-03-mises-a-jour/).

Pour chaque intégration : consigner source, date réelle, couverture, conditions
de réutilisation et attribution. Pour les scans : conserver les points de contrôle,
comparer les transformations, tester des points indépendants et documenter les
limites. Réutiliser l’outillage de 1875, mais jamais ses points ni sa déformation.
