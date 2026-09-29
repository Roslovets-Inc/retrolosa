# Toulouse · Au fil du temps

Une carte interactive pour explorer Toulouse en 1680, 1830, 1875, 1954 et aujourd’hui.
React 19, TypeScript, Vite 8, MapLibre GL JS 6 et PMTiles 4. Interface en français,
sans serveur applicatif ni clé API.

## Démarrage

Prérequis : **Bun 1.4.2**, **Node.js 22.12+** (Node 24 dans la CI).
Le gestionnaire de dépendances est Bun ; le fichier de référence est uniquement
`bun.lock`. Les versions de React, Vite et des sources cartographiques existantes
ont été conservées pendant la migration.

```sh
bun project install
bun project doctor
bun project dev
```

Ouvrir http://127.0.0.1:5173. Les fonds de carte nécessitent une connexion Internet.

Le point d’entrée `project` fonctionne également sous Windows avec
`./project.cmd check` ou `./project.ps1 check`, et sous Unix avec
`sh ./project check`. Il travaille toujours depuis la racine du projet, même
lorsqu’il est lancé depuis un autre répertoire. `bun project help` liste les commandes.

## Commandes de développement

| Commande                  | Usage                                                 |
| ------------------------- | ----------------------------------------------------- |
| `bun project dev`         | Serveur Vite local                                    |
| `bun project doctor`      | Vérification des runtimes et outils installés         |
| `bun project check`       | Format, lint, types et tests unitaires hors ligne     |
| `bun project prep`        | Formatage, corrections lint sûres, puis vérifications |
| `bun project build`       | Types et compilation de production                    |
| `bun project preview`     | Prévisualisation locale de la compilation             |
| `bun project test`        | Vitest avec couverture                                |
| `bun project test:watch`  | Tests unitaires en continu                            |
| `bun project test:e2e`    | Scénarios Playwright dans le navigateur               |
| `bun project test:e2e:ui` | Interface interactive Playwright                      |
| `bun project verify`      | Vérifications, compilation et tests navigateur        |

Les scripts directs restent accessibles : `bun run lint`, `bun run lint:fix`,
`bun run typecheck`, `bun run format`, `bun run format:check`, etc.
Les arguments supplémentaires sont transmis, par exemple :
`bun project test:e2e tests/share.spec.ts --workers=1`.

## Qualité et tests

- **Oxlint** vérifie TypeScript, React et l’ordre des hooks. Les avertissements
  font échouer la vérification. Les exceptions sont locales et expliquées.
- **Oxfmt** impose un format commun : largeur 100, guillemets doubles,
  points-virgules et fins de ligne LF. Les cartes, données générées et rapports
  sont exclus du formatage.
- **TypeScript** vérifie l’application, les tests et les configurations.
- **Vitest** teste les seuils de la frise et les transitions entre époques activées.
  Le seuil de couverture de 100 % concerne uniquement `src/timeline.ts`,
  pas toute l’application. Le rapport est dans `coverage/`.
- **Playwright** vérifie les cartes réelles, le partage, la navigation limitée à
  Toulouse, les modes de comparaison et le mobile. Il démarre Vite automatiquement
  et peut réutiliser un serveur local existant. Les traces des échecs sont dans
  `test-results/`. Les captures manuelles des scénarios sont dans `.local/`.

Sur Windows, les tests navigateur utilisent Microsoft Edge installé. Sur Linux
et macOS, installer Chromium avec `bun x playwright install chromium`.
Pour choisir un autre navigateur, définir `PLAYWRIGHT_CHANNEL` (par exemple
`chrome` ou `msedge`). Définir `PLAYWRIGHT_PORT` pour isoler le serveur de tests sur un autre port local.
Les tests E2E dépendent des services cartographiques
externes et nécessitent Internet ; `check` et les tests unitaires fonctionnent
sans réseau une fois les dépendances installées.

Le workflow GitHub Actions exécute les mêmes commandes sur les pull requests et
les pushes vers `main`. Il conserve la couverture et les diagnostics navigateur
pendant sept jours. Il n’effectue aucune publication.

## Dépendances et conventions

`bun project install` utilise `bun install --frozen-lockfile` : les versions
installées doivent correspondre au lockfile. Pour ajouter une dépendance, utiliser
`bun add` ou `bun add --dev`, puis inclure les changements de `package.json`
et `bun.lock`. `bunfig.toml` fixe les nouvelles versions et impose une ancienneté
minimale de cinq jours aux nouvelles résolutions.

Les conventions de commit et les règles pour les agents sont dans
[AGENTS.md](AGENTS.md). Utiliser Semantic / Conventional Commits.
La publication dans Sites requiert une demande explicite de l’utilisateur pour
les changements concernés ; aucune commande `project` ne déploie le site.

Références des outils :
[configuration Oxlint](https://oxc.rs/docs/guide/usage/linter/config),
[lockfile Bun](https://bun.sh/docs/pm/lockfile).

## Cartes et utilisation

- Frise continue, rideau, superposition et vue historique.
- Choix des époques incluses dans la frise.
- Maintien du bouton avec l’œil pour lire les rues actuelles avec un léger fond historique.
- Localisation opt-in et déplacements limités à Toulouse et ses alentours.
- Vue d’ensemble du centre de Toulouse au démarrage et au retour à l’accueil cartographique.
- Partage explicite d’une vue avec ses réglages ; l’adresse reste stable pendant la navigation.

Les cadastres 1680/1830 sont des rendus modernes de données historiques par
Makina Corpus / Toulouse Métropole. Le plan d’inondation de 1875 est un scan
d’archive calé manuellement. La photographie aérienne de 1954 vient d’IGN / Edugéo.
Le fond actuel est OpenFreeMap / OpenStreetMap. La provenance, les contrôles de
calage et les limites de précision sont documentés dans [docs/sources.md](docs/sources.md).
Les outils Python de génération des cartes restent séparés du build web ; les
assets préparés sont inclus dans le dépôt.
