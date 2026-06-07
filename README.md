# Push Pull Skip

**Carnet d'entraînement** simple et privé, structuré autour de la routine
**Push / Pull / Legs** (« Skip »). Enregistre tes séances, suis ta progression,
bats tes records — sans compte en ligne, 100 % sur ton appareil.

Application **cross-platform** construite avec **Tauri 2** : un seul code pour le
desktop (macOS, Windows, Linux) et Android.

---

## ✨ Fonctionnalités

- **Séances** — enregistre chaque séance avec ses exercices, séries, reps et charges.
- **Références** — tes séances types (avec couleur) et exercices types (par groupe
  musculaire) te sont proposés automatiquement à la saisie.
- **Historique** — toutes tes séances regroupées par mois, dépliables, éditables.
- **Suivi** — grille de régularité, volume cumulé et hebdomadaire, séries de records.
- **Analyse** — courbe de progression par exercice (poids, charge/série, charge totale)
  avec filtre de dates, et records de charge tous exercices.
- **Chronomètre** — chrono de séance (avec tours) et minuteur de repos.
- **Profil** — photo, âge, taille, poids, genre ; langue et thème.

## 💻 Plateformes

| Desktop | Mobile |
| ------- | ------ |
| macOS (Apple Silicon + Intel), Windows, Linux | Android |

## 🌍 Langues

- **Français** (par défaut) et **English**.
- Changement de langue dans l'app (page d'accueil ou profil) — le choix est mémorisé.

## 📦 Installation

### Pour les utilisateurs

Télécharge l'installeur depuis la page **[Releases](../../releases)** du dépôt :

- **macOS** — `.dmg` (Apple Silicon ou Intel)
- **Windows** — `.exe` / `.msi`
- **Linux & Android** — à construire depuis les sources pour l'instant (voir ci-dessous)

> Les binaires ne sont pas signés : à la première ouverture, macOS (Gatekeeper) ou
> Windows (SmartScreen) peut afficher un avertissement — autorise l'app manuellement.

### Depuis les sources

Prérequis : **Node 20+**, **Rust** stable (`rustup`) et les
[dépendances système Tauri](https://tauri.app/start/prerequisites/).

```bash
npm install                 # CLI Tauri (racine)
npm install --prefix front  # dépendances du front
npm run tauri dev           # lance l'app en développement
npm run tauri build         # construit l'installeur pour ta plateforme
```

Android (après installation du SDK/NDK et `$JAVA_HOME`) :

```bash
npm run android:init        # une seule fois
npm run android:dev         # émulateur / appareil branché
npm run android:build       # APK / AAB
```

## 🔒 Données & confidentialité

- Tout est stocké **localement** dans une base JSON, dans le dossier de données de
  l'app — aucune donnée n'est envoyée sur un serveur.
- L'app fonctionne **hors ligne**.
- Les mots de passe ne sont **jamais** stockés en clair (hachage **Argon2**).
- À la première ouverture, la base est **vide** : tu construis ton carnet au fil
  de tes entraînements.

## 🏷️ Versions

Version actuelle : **0.1.0**. Le projet suit le [versionnage sémantique](https://semver.org/) ;
l'historique des changements est dans [CHANGELOG.md](./CHANGELOG.md).

Pousser un tag `v*` (ex. `v0.1.1`) déclenche la construction et la publication
automatiques des installeurs macOS et Windows.

## 🛠️ Stack technique

React + TypeScript + Tailwind CSS v4 (Vite) pour l'interface ; Rust pour le cœur
natif (logique et accès aux données via des commandes Tauri appelées en IPC).

---

© 2026 Push Pull Skip.
