# Changelog

All notable changes to **Push Pull Skip** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-06

### Added
- First release as a cross-platform **Tauri 2** application (desktop + Android).
- React + TypeScript + Tailwind CSS front, pixel-perfect reproduction of the
  reference prototype, with the requested design tweaks:
  - Secondary colour set to **orange**.
  - **Modern** display typography (Space Grotesk).
  - **Soft** rounded corners.
  - Suivi (tracking) view defaulting to **cards**.
- Rust backend with a typed data model (`user`, `séance`, `exercice`,
  `historique`) using serde Serialize/Deserialize.
- Local **NoSQL JSON database** stored in the OS app-data directory, with an
  isolated data-access layer (`store.rs`), first-launch seeding, atomic writes
  and a schema-version field for future migrations.
- Argon2-hashed passwords (never stored in clear text).
- Tauri commands exposed to the front via `invoke()`: bootstrap, auth
  (signup / login / profile), séance & exercise references, and sessions.
- Pages: Accueil, FAQ, Connexion/Inscription, Historique, Ajouter une séance,
  Références, Chronomètre, Suivi (cartes / éditorial / dense).

[0.1.0]: https://example.com/releases/0.1.0
