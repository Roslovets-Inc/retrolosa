# Architecture de l’exploration

## Époques et sources

`src/epochs/catalog.ts` décrit les époques dans l’ordre chronologique. Il fournit
les libellés, les crédits, les orientations et les sources. Cet ordre est aussi
l’ordre de dessin : une carte plus récente est dessinée au-dessus de la précédente.
`details.ts` contient les textes de provenance et les liens vers les documents.
Les nombres de points de contrôle disponibles sont tirés des métadonnées.

`types.ts` définit les variantes de rendu : image, tuiles, archive PMTiles et
image d’ensemble suivie d’une source détaillée. Les coordonnées et les emprises
importées sont validées avant leur utilisation.

`sources.ts` traduit ce catalogue en style MapLibre. Le chemin de déploiement et
l’origine sont des paramètres explicites ; ce module ne lit pas `location`.
Les identifiants de couches sont fournis par `epochLayerIds`, sans dépendance
à une époque particulière pour appliquer les transparences.

Pour ajouter une époque :

1. Préparer explicitement les assets et leurs métadonnées géographiques.
2. Ajouter son texte de provenance dans `details.ts` et sa définition dans le
   catalogue, à sa place chronologique.
3. Choisir une variante de rendu existante, avec les emprises et zooms pertinents.
4. Exécuter `bun run check` et les scénarios navigateur concernés.

## État et présentation

`src/view/state.ts` contient l’état persistant de la vue et ses transitions.
Le reducer modifie les époques et le temps dans une seule transition. La
normalisation trie et déduplique les époques et borne les valeurs numériques.
Une sélection vide représente la ville actuelle. Réactiver une époque conserve
le temps actuel ; le visiteur peut ensuite choisir cette époque sur la frise.

Le fragment d’URL est lu une seule fois au démarrage avec `parseViewState`.
`serializeViewState` produit le lien de partage à partir de l’état et de la caméra
vivante, sans modifier l’adresse. Les anciens modes `modern`, `historic` et `time`
restent compatibles. Le champ historique `year` est conservé dans les liens.
L’année actuelle est un paramètre explicite des fonctions de calcul.

`src/view/presentation.ts` calcule les couches actives, leurs transparences,
l’époque dominante, les libellés, les crédits et l’orientation. Entre deux
cartes historiques, la précédente reste opaque et la suivante apparaît
progressivement au-dessus : les deux coefficients ne doivent pas être normalisés
pour totaliser un. Vers la ville actuelle, la dernière carte historique disparaît
progressivement. À l’arrivée, aucun crédit historique n’est affiché.

Les actions temporaires de comparaison sont distinctes de l’état partagé.
Elles changent la présentation sans remplacer le mode, l’opacité ou le temps
choisis. Elles ne tournent pas la caméra à chaque pression et relâchement.

## Vérification et limites actuelles

`src/map/controller.ts` possède les deux renderers, leur synchronisation et leurs
abonnements. `useMaps.ts` relie leur cycle de vie à React ; un échec partiel du
démarrage libère les ressources déjà créées. Les coordonnées ont leur propre
abonnement dans `Coordinates.tsx`, sans rendre à nouveau toute l’application.

Seules les époques qui contribuent à la date choisie sont installées. Pour une
source avec vue d’ensemble et détails, seul le rendu correspondant au zoom est
présent. Les changements d’opacité et les déplacements dans le même intervalle
de zoom ne recréent pas les sources. Pendant une comparaison temporaire, les
sources historiques restent disponibles mais ne bloquent pas le statut visible.

`loading.ts` suit séparément les ressources requises et leurs échecs. Un événement
`idle` ne supprime jamais une erreur. La réussite de la même requête ou une
nouvelle tentative la supprime ; les sources désactivées ne bloquent plus la vue.
« Réessayer » remplace les sources historiques en échec ou recharge le style
actuel, en conservant les renderers, la caméra et l’état de comparaison.

Les contrats du catalogue et de la vue sont testés sous Node, sans démarrer React
ni MapLibre. La couverture obligatoire à 100 % concerne `timeline.ts` et les
modules de `src/view/`. Les scénarios de `tests/view-state.spec.ts` vérifient
leur intégration dans le navigateur avec les services externes simulés.

Les tests État-major séparent la cohérence des annotations et du rapport, le
suivi de chaque repère, les contrôles indépendants, les voisins des tuiles et
l’absence de repliement. Le nombre de points peut évoluer sans désactiver les
vérifications géométriques.

Les tests du contrôleur simulent MapLibre pour vérifier les transitions, l’ordre
des couches et la libération des ressources. `tests/map-loading.spec.ts` vérifie
la reprise après une erreur réseau et l’absence de requêtes vers les archives
inactives. Les tests avec services cartographiques réels restent distincts.

Une grande partie du JSX reste dans `main.tsx`. Son découpage, la consolidation
du CSS et le traitement des tuiles État-major dans un worker constituent les
étapes suivantes.
