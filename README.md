# PPS : Push Pull Skip

**A simple, private workout journal** built around your gym routine. Log your sessions, track your progress, beat your records —
no online account, 100% on your device.

A **cross-platform** app built with **Tauri 2**: one codebase for desktop
(macOS, Windows, Linux) and Android.

>[!NOTE] 
> Not on iOS because I'm broke. 
---

## ✨ Features

- **Sessions** — log each session with its exercises, sets, reps and loads.
- **References** — your session templates (each with a colour) and exercise
  templates (by muscle group) are suggested automatically as you type.
- **History** — every session grouped by month, expandable and editable.
- **Tracking** — consistency grid, cumulative and weekly volume, record streaks.
- **Analysis** — progression chart per exercise (weight, load/set, total load)
  with a date filter, plus strength records across all exercises.
- **Timer** — session stopwatch (with laps) and rest timer.
- **Profile** — photo, age, height, weight, gender; language and theme.

## 💻 Platforms

| Desktop | Mobile |
| ------- | ------ |
| macOS (Apple Silicon + Intel), Windows, Linux | Android |

## 🌍 Languages

- Available in **French** (default) and **English**.
- Switch language inside the app (landing page or profile) — your choice is remembered.

## 📦 Installation

### For users

Download the installer from the repository's **[Releases](../../releases)** page:

- **macOS** — `.dmg` (Apple Silicon or Intel)
- **Windows** — `.exe` / `.msi`
- **Linux & Android** — build from source for now (see below)

> The binaries are unsigned: on first launch, macOS (Gatekeeper) or Windows
> (SmartScreen) may show a warning — allow the app manually.

### From source

Requirements: **Node 20+**, **Rust** stable (`rustup`), and the
[Tauri system dependencies](https://tauri.app/start/prerequisites/).

```bash
npm install                 # Tauri CLI (root)
npm install --prefix front  # front-end dependencies
npm run tauri dev           # run the app in development
npm run tauri build         # build the installer for your platform
```

Android (after installing the SDK/NDK and setting `$JAVA_HOME`):

```bash
npm run android:init        # once
npm run android:dev         # emulator / connected device
npm run android:build       # APK / AAB
```

## 🔒 Data & privacy

- Everything is stored **locally** in a JSON database inside the app's data
  folder — no data is ever sent to a server.
- The app works **offline**.
- Passwords are **never** stored in clear text (**Argon2** hashing).
- On first launch the database is **empty**: you build your journal as you train.

## 🏷️ Versions

Current version: **0.1.0**. The project follows [semantic versioning](https://semver.org/);
the change history lives in [CHANGELOG.md](./CHANGELOG.md).

Pushing a `v*` tag (e.g. `v0.1.1`) automatically builds and publishes the macOS
and Windows installers.

## 🛠️ Tech stack

React + TypeScript + Tailwind CSS v4 (Vite) for the UI; Rust for the native core
(logic and data access via Tauri commands called over IPC).

---

© 2026 PPS.
