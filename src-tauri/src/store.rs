//! Data-access layer: the only module that touches the filesystem. It owns the
//! JSON "database" stored in the OS app-data directory, seeds it on first
//! launch, migrates older versions forward, and persists changes atomically.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Manager};

use crate::models::{Database, Seed, SCHEMA_VERSION};

/// First-launch seed data, embedded at compile time. Empty by default: a fresh
/// install starts with no references or sessions until the user adds their own.
const SEED_JSON: &str = include_str!("../seed.json");

/// File name of the JSON database inside the app-data directory.
const DB_FILE: &str = "pps-db.json";

/// In-memory database guarded by a mutex plus the resolved on-disk path.
/// Managed as Tauri state so every command shares a single source of truth.
pub struct Store {
    pub db: Database,
    pub path: PathBuf,
}

impl Store {
    /// Persist the current database to disk atomically (write to a temp file,
    /// then rename over the target so a crash mid-write can't corrupt data).
    pub fn persist(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.db).map_err(|e| e.to_string())?;
        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, json.as_bytes()).map_err(|e| format!("write tmp: {e}"))?;
        fs::rename(&tmp, &self.path).map_err(|e| format!("rename: {e}"))?;
        Ok(())
    }
}

/// Convenience alias for the managed state type.
pub type StoreState = Mutex<Store>;

/// Resolve the database path, creating the app-data directory if needed.
fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("create_dir_all: {e}"))?;
    Ok(dir.join(DB_FILE))
}

/// Build a fresh database from the embedded seed.
fn seeded_database() -> Result<Database, String> {
    let seed: Seed = serde_json::from_str(SEED_JSON).map_err(|e| format!("seed parse: {e}"))?;
    Ok(Database {
        version: SCHEMA_VERSION,
        user: None,
        seance_refs: seed.seance_refs,
        exercise_refs: seed.exercise_refs,
        sessions: seed.sessions,
    })
}

/// Apply forward migrations to a loaded database. Today it only stamps the
/// current version; future schema changes hook in here.
fn migrate(mut db: Database) -> Database {
    if db.version < SCHEMA_VERSION {
        db.version = SCHEMA_VERSION;
    }
    db
}

/// Load the database from disk, or create + persist a seeded one on first run.
/// Returns a [`Store`] ready to be managed as Tauri state.
pub fn load(app: &AppHandle) -> Result<Store, String> {
    let path = db_path(app)?;
    let db = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| format!("read db: {e}"))?;
        match serde_json::from_str::<Database>(&raw) {
            Ok(db) => migrate(db),
            Err(e) => {
                // Corrupt or unreadable: back it up and start clean rather than
                // leaving the app unusable.
                log::error!("database parse error ({e}); reseeding");
                let backup = path.with_extension("json.bak");
                let _ = fs::rename(&path, &backup);
                seeded_database()?
            }
        }
    } else {
        seeded_database()?
    };

    let store = Store { db, path };
    store.persist()?;
    Ok(store)
}
