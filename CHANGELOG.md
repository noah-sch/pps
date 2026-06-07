# Changelog

All notable changes to **Push Pull Skip** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.2] — 2026-06-07

### Added
- **Android APK** is now built and published by CI on every `v*` tag (debug-signed
  universal APK, installable directly), attached to the same GitHub Release as the
  desktop installers.

### Changed
- The version shown on the landing page is now **dynamic**, read from the app
  (`CARGO_PKG_VERSION` via the `app_version` command) instead of being hard-coded.

## [0.1.1] — 2026-06-07

### Fixed
- **macOS** bundles are now ad-hoc signed during the CI build, so Gatekeeper no
  longer reports the app as *"damaged"* on Apple Silicon. First launch now shows
  the regular unverified-developer prompt, bypassable via System Settings →
  *Open Anyway* (the app is still not Developer-ID signed nor notarized).

### Docs
- Installation note explaining how to clear the macOS quarantine flag
  (`xattr -dr com.apple.quarantine`) and the Windows SmartScreen prompt.

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

[0.1.2]: https://github.com/noah-sch/pps/releases/tag/v0.1.2
[0.1.1]: https://github.com/noah-sch/pps/releases/tag/v0.1.1
[0.1.0]: https://github.com/noah-sch/pps/releases/tag/v0.1.0
