# Rétrolosa

Carte interactive de Toulouse en 1631, 1680, 1830, 1875, 1954 et aujourd’hui.
React 19, TypeScript, Vite 8, MapLibre GL JS 6 et PMTiles 4. Interface en français.

## Licence

Copyright (C) 2026 Pavel Roslovets et les contributeurs de Rétrolosa.

Le code et la documentation originale du projet sont distribués sous
**GNU Affero General Public License, version 3 ou ultérieure**
(`AGPL-3.0-or-later`). Voir [LICENSE](LICENSE) et le [périmètre de la licence](docs/licensing.md).
L’utilisation, la modification et la redistribution, y compris commerciales, sont autorisées
dans les conditions de cette licence. Les versions dérivées doivent conserver ces libertés ;
une version modifiée accessible par le réseau doit proposer son code source aux utilisateurs.

Les cartes, photographies, données, polices et autres éléments tiers conservent leurs droits
et conditions propres. La licence du logiciel ne constitue pas une autorisation de les réutiliser.

## Démarrage

Prérequis : Bun 1.4.2 et Node.js 22.12+ ; `.nvmrc` et la CI utilisent Node 24.
Exécuter les commandes depuis la racine du dépôt.

```sh
bun install --frozen-lockfile
bun run dev
```

Ouvrir http://127.0.0.1:5173. Les cartes nécessitent Internet.
`bun start` et `bun local` sont des alias de développement.

## Commandes

| Commande              | Usage                                           |
| --------------------- | ----------------------------------------------- |
| `bun run dev`         | Serveur local                                   |
| `bun run check`       | Format, lint, types et tests unitaires          |
| `bun run prep`        | Formatage, corrections lint, puis vérifications |
| `bun run build`       | Types et compilation de production              |
| `bun run preview`     | Prévisualisation de la compilation              |
| `bun run test`        | Vitest avec couverture                          |
| `bun run test:watch`  | Vitest en continu                               |
| `bun run test:e2e`    | Tests navigateur Playwright                     |
| `bun run test:e2e:ui` | Interface Playwright                            |
| `bun run verify`      | Vérifications, compilation et tests navigateur  |

Format et lint sont disponibles séparément : `bun run format`,
`bun run format:check`, `bun run lint`, `bun run lint:fix`, `bun run typecheck`.
Transmettre les arguments directement :
`bun run test:e2e tests/share.spec.ts --workers=1`.
Utiliser `bun run test` pour Vitest ; `bun test` appelle le runner natif de Bun.

## Qualité

Le socle s’inspire de PumpRoom-UI : Bun, Oxfmt, Oxlint avec le plugin officiel
React Hooks et Vitest. Les avertissements lint font échouer la vérification.
Oxfmt impose les fins de ligne LF et exclut les cartes et données générées.
TypeScript vérifie l’application, les tests et les configurations.

Vitest vérifie les transitions et seuils de la frise. Le seuil de couverture de
100 % concerne uniquement `src/timeline.ts`, pas toute l’application.
Playwright vérifie les cartes, les modes de comparaison, le partage et le mobile.
Les tests navigateur nécessitent Internet ; les vérifications hors ligne
fonctionnent après installation des dépendances.

Sur Windows, Playwright utilise Edge. Sur Linux et macOS, installer Chromium :
`bun x playwright install chromium`. `PLAYWRIGHT_CHANNEL` permet de choisir le
navigateur et `PLAYWRIGHT_PORT` d’isoler le serveur de tests.
Les rapports sont dans `coverage/`, `playwright-report/` et `test-results/` ; les
captures manuelles dans `.local/`.

GitHub Actions vérifie, compile et publie le site à chaque push vers `main`,
et conserve les diagnostics pendant sept jours. Une vérification ou un test en échec
bloque la publication.

## Publication GitHub Pages

Le workflow unique `Deploy to GitHub Pages` (`.github/workflows/pages.yml`) se lance
automatiquement à chaque push vers `main`. Il vérifie le projet, compile `dist/`,
exécute les tests navigateur, puis publie avec les actions officielles GitHub Pages.
Un lancement manuel reste disponible depuis **Actions → Deploy to GitHub Pages →
Run workflow**, sur `main`. Les commandes locales et l’installation des dépendances
ne déclenchent pas de publication.

Après avoir envoyé le dépôt sur GitHub, sélectionner **Settings → Pages →
Build and deployment → Source → GitHub Actions**. Les règles de protection de
l’environnement `github-pages` doivent autoriser la branche `main`.

Le chemin de base fourni par GitHub Pages est transmis à Vite via `VITE_BASE_PATH` ;
les cartes, polices et liens fonctionnent aussi sous le chemin du dépôt. Pour
reproduire cette compilation localement, définir `VITE_BASE_PATH=/toulouse-in-time/`
avant `bun run build`, puis utiliser `bun run preview` et ouvrir ce chemin.
La compilation locale utilise `/` par défaut.

## Dépendances et conventions

`bun.lock` est le seul lockfile. Ajouter des dépendances avec `bun add` ou
`bun add --dev`, puis inclure `package.json` et `bun.lock`. `bunfig.toml` fixe
les nouvelles versions et une ancienneté minimale de cinq jours.
Les règles des agents et les Semantic / Conventional Commits sont définis
dans [AGENTS.md](AGENTS.md). Toute publication Sites nécessite une demande
explicite pour les changements concernés.

## Cartes et utilisation

Frise continue, rideau, fondu avec transparence et vue actuelle. Les époques décochées
sont ignorées par la frise. Maintenir le bouton œil affiche les rues actuelles
avec une légère superposition historique. La géolocalisation est facultative.
La navigation est limitée à Toulouse ; le retour à la vue d’ensemble montre
le centre. Le partage crée explicitement un lien sans modifier l’adresse.

Le plan Tavernier de 1631 est un scan des Archives municipales, recalé sur
22 repères au sol. Quatre contrôles distincts autour de Nazareth et du Salin donnent 8 à 39 mètres
d’écart ; ils ne représentent pas la précision de toute la ville.
Les cadastres 1680/1830 sont des rendus modernes de Makina Corpus / Toulouse
Métropole. Le plan d’inondation de 1875 est un scan calé manuellement.
La photographie de 1954 vient d’IGN / Edugéo ; le fond actuel d’OpenFreeMap / OSM.

Voir [sources et précision](docs/sources.md) et [cartes restantes](docs/map-backlog.md).
Les générateurs Python sont séparés du build web ; les assets préparés sont
inclus dans le dépôt.
