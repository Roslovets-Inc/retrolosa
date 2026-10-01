# Architecture de l’exploration

## Époques et sources

`src/epochs/catalog.ts` décrit les époques dans l’ordre chronologique. Il fournit
les libellés, les crédits, les orientations et les sources. Cet ordre est aussi
l’ordre de dessin : une carte plus récente est dessinée au-dessus de la précédente.
`details.ts` contient les textes de provenance et les liens vers les documents.
Il est importé par le dialogue de sources, chargé à la demande, et jamais par le
catalogue. `getEpochDetails(id)` fournit la description ; `getEpoch(id)` reste
limité aux données de présentation et de rendu. `Record<EpochId, EpochDetails>`
exige une description pour chaque époque du catalogue.

Les nombres de points de contrôle disponibles sont tirés des métadonnées.
Le catalogue importe explicitement les coordonnées, les emprises, les révisions
et les adresses nécessaires aux cartes. Les descriptions importent seulement
les champs utilisés dans leurs textes ; les annotations complètes ne sont pas
nécessaires au rendu. Les fichiers géographiques restent les sources communes,
sans copier leurs valeurs dans un deuxième catalogue.

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

## Cycle de vie des cartes

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

Le protocole État-major (`src/etat-major.ts`) valide les adresses et délègue les
tuiles à `etat-major/client.ts`. Le worker démarre au premier besoin : il charge
les images IGN, assemble les voisins et rééchantillonne les pixels. La géométrie
pure reste dans `geometry.ts`, avec les mêmes contrôles de calage et de voisinage.
Les résultats PNG sont transférés par `ArrayBuffer`, sans copie du buffer.

Chaque requête possède un identifiant et un signal d’annulation. Le client rejette
immédiatement une requête annulée ; le worker reçoit l’annulation et vérifie le
signal entre les lots de lignes. Les bitmaps sont fermés dans `finally`. La
fermeture des cartes termine le worker, rejette les requêtes en attente et retire
les abonnements. Un échec du worker permet de créer un nouveau worker au prochain
essai ; les erreurs des sources conservent leur statut HTTP.

## Interface et styles

`main.tsx` compose les composants et conserve l’état partagé, les raccourcis
globaux et les services de carte. `src/components/` délimite les responsabilités :

- `Header` gère les lieux, le thème et le partage, avec nettoyage du minuteur de
  confirmation. Le lien est fourni par l’application à partir de sa vue courante.
- `MapViewport` possède la position et les gestes de la loupe, et affiche le rideau.
- `MapTools` expose la localisation, le zoom, l’orientation et l’opacité.
- `ComparisonPanel` gère les gestes de la frise et les choix d’époques et de modes.
- `SourcesDialog` présente les documents et leurs crédits à partir du catalogue.
  Son module est chargé à la première ouverture.

L’application conserve un seul choix de panneau ouvert (`places`, `epochs` ou
aucun). Les états locaux des composants ne dupliquent pas l’état persistant de
la vue et ne participent pas au lien de partage.

`style.css` est l’unique point d’entrée des styles du projet : `colors.css` pour
les couleurs, `base.css` pour les règles globales, `app.css` pour l’application
et ses variantes responsives, `ui.css` pour les primitives Radix. Le fichier
`compact.css` et les règles du précédent écran ont été supprimés. Les règles
restantes conservent leur ordre de cascade ; les déclarations déjà dominées par
une règle identique ultérieure ont été retirées.

## Vérification et limites actuelles

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

Les scénarios de partage, de comparaison et de loupe utilisent des services
externes simulés : ils vérifient les gestes et les états de l’interface sans
dépendre de la disponibilité d’un fournisseur de cartes.

`tests/source-loading.spec.ts` vérifie que les descriptions et le rapport de
validation État-major ne sont pas demandés à l’ouverture de l’application, puis
apparaissent à l’ouverture des sources. Une deuxième époque réutilise le module
déjà chargé. Le test unitaire des descriptions contrôle la couverture du catalogue,
les textes interpolés et les liens ; le scénario de la vue vérifie chaque époque.

La configuration Vite sépare MapLibre, les dépendances d’interface et le code
de l’application pour que le cache des bibliothèques survive aux changements
de l’interface. MapLibre reste nécessaire au premier affichage : le découpage
ne supprime pas le coût de cette dépendance. Les workers et les modules dynamiques
respectent le chemin de déploiement configuré par `VITE_BASE_PATH`.

Les variantes responsives restent explicites dans `app.css` ; toute réorganisation
de leur cascade doit préserver les dimensions, le focus et l’accessibilité des
contrôles. Les prochaines vérifications concernent les requêtes IGN voisines,
leur parallélisme et la mesure du bénéfice d’un cache borné, ainsi que les
dépendances des composants envers les contrôleurs cartographiques.
