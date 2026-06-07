# Push Pull Skip

Carnet d'entraînement structuré autour de la routine **Push / Pull / Legs**
(« Skip »). Application **Tauri 2** cross-platform (desktop macOS / Windows /
Linux + Android), reproduction pixel-perfect du prototype `./example` avec les
tweaks de design demandés.

- **Front** : React + TypeScript (TSX) + Tailwind CSS v4 (Vite)
- **Back** : Rust (cœur Tauri). Toute la logique et l'accès aux données passent
  par des commandes `#[tauri::command]` appelées depuis React via `invoke()`.
- **Base de données** : fichiers JSON locaux (NoSQL) dans le répertoire de
  données de l'app, (dé)sérialisés avec `serde` / `serde_json`.

## Design tweaks appliqués

| Tweak                | Valeur                                              |
| -------------------- | --------------------------------------------------- |
| Couleur secondaire   | **Orange** (`--accent: oklch(0.7 0.17 50)`)         |
| Titres               | **Moderne** (Space Grotesk)                         |
| Coins                | **Doux** (rayon `18px`)                             |
| Vue de suivi         | **Cartes** par défaut                               |

## Structure

Le front (UI React) et le back (cœur natif Rust = l'« API ») sont **séparés,
côte à côte**. Dans Tauri il n'y a pas de routes/endpoints HTTP : les fonctions
`#[tauri::command]` de `commands.rs` **sont** les endpoints, appelées via
`invoke()` (IPC) et compilées dans le même binaire que l'app.

```
pps/
├─ example/                  # prototype de référence (HTML/JSX) — source du port
├─ front/                    # FRONT — interface React uniquement
│  └─ src/
│     ├─ types.ts            # types partagés (miroir des structs Rust)
│     ├─ api.ts              # wrappers invoke() typés (le client de l'API)
│     ├─ derive.ts           # stats dérivées (PR, volume, calendrier…) + formats
│     ├─ components.tsx      # primitives UI (Card, Button, charts…)
│     ├─ icons.tsx           # icônes ligne
│     ├─ pages_public.tsx    # Accueil, Connexion/Inscription, FAQ
│     ├─ pages_app.tsx       # Historique, Ajouter, Chronomètre
│     ├─ references.tsx      # Références (séances + exercices) + comboboxes
│     ├─ tracking.tsx        # Suivi (régularité, volume) + Analyse (graphe, records)
│     ├─ onboarding.tsx      # questionnaire post-inscription (profil + 1ères références)
│     ├─ profile.tsx         # Mon profil (compte, photo, langue, thème)
│     ├─ i18n.tsx            # internationalisation (FR base + EN)
│     └─ App.tsx             # routing + shell + câblage des données
├─ src-tauri/                # BACK — cœur natif Rust (l'API)
│  ├─ seed.json              # graine de première installation (vide par défaut)
│  ├─ tauri.conf.json        # pointe vers ../front/dist
│  └─ src/
│     ├─ models.rs           # user / séance / exercice / historique (serde)
│     ├─ store.rs            # couche d'accès JSON isolée (app data dir, écriture atomique)
│     ├─ auth.rs             # hachage Argon2 des mots de passe
│     ├─ commands.rs         # commandes Tauri exposées au front (= les endpoints)
│     └─ lib.rs              # enregistrement des commandes + état partagé
├─ package.json              # scripts racine (npm run tauri dev / build)
├─ .github/workflows/release.yml  # build desktop macOS + Windows sur tag
└─ CHANGELOG.md
```

## Base de données (schéma)

Stockée dans `pps-db.json` au sein du répertoire de données de l'app
(`app_data_dir`). Champs marqués _(opt.)_ facultatifs.

- **user** : `name`, `email`, `password` _(haché Argon2, jamais en clair)_,
  `gender` _(opt.)_, `height` _(opt.)_, `weight` _(opt.)_, `language` _(opt.)_
- **références**
  - séance : `{ name, color }`
  - exercice : `{ name, groupe_musculaire (opt.), commentaire (opt.) }`
- **sessions** : liste des séances enregistrées au fil du temps.

À la première ouverture, la base est créée **vide** : aucune référence ni séance
préchargée. L'utilisateur construit son carnet en ajoutant ses propres séances
types, exercices types et séances au fil de ses entraînements.

## Développement

Prérequis : Node 20+, Rust stable (`rustup`), et les
[dépendances système Tauri](https://tauri.app/start/prerequisites/).

```bash
# à la racine du projet
npm install                 # installe le CLI Tauri (racine)
npm install --prefix front  # installe les dépendances du front
npm run tauri dev           # lance Vite (front) + l'app desktop
```

Autres commandes (depuis la racine) :

```bash
npm run tauri build         # build + installeur desktop pour la plateforme courante
npm run front:build         # build statique du front seul (front/dist/)
```

## Versions

Le numéro de version est suivi dans quatre fichiers, gardés alignés :
`package.json` (racine), `front/package.json`, `src-tauri/Cargo.toml`,
`src-tauri/tauri.conf.json`. La base de données porte un champ `version` pour
les migrations de schéma. La commande Tauri `app_version` renvoie la version
courante (affichée en infobulle sur le logo). L'historique des versions est
tenu dans [`CHANGELOG.md`](./CHANGELOG.md).

### Export sur Git (desktop macOS + Windows)

Le workflow [`.github/workflows/release.yml`](./.github/workflows/release.yml)
construit et publie automatiquement les installeurs **macOS (Apple Silicon +
Intel)** et **Windows** à chaque tag `v*` :

```bash
git tag v0.1.1                 # après avoir aligné les 4 fichiers de version
git push origin v0.1.1
```

## Android

Le code est compatible Android (stockage via `app_data_dir`, aucune API
desktop-only). Pour cibler Android, après installation du SDK/NDK Android et de
`$JAVA_HOME` :

```bash
# à la racine du projet
npm run android:init          # génère src-tauri/gen/android
npm run android:dev           # émulateur / appareil branché
npm run android:build         # APK / AAB
```
