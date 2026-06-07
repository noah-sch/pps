//! Typed data model for Push Pull Skip — shared by the store and the Tauri
//! commands. Every struct derives serde so it round-trips to JSON on disk and
//! across the `invoke()` boundary with the TypeScript front.

use serde::{Deserialize, Serialize};

/// Current on-disk schema version. Bumped whenever the persisted shape changes
/// so [`crate::store`] can migrate older databases forward.
pub const SCHEMA_VERSION: u32 = 1;

fn default_version() -> u32 {
    SCHEMA_VERSION
}

/// A single set within an exercise — `reps` repetitions at `weight` kilograms.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetEntry {
    pub reps: f64,
    pub weight: f64,
}

/// One exercise performed during a session, with its list of sets.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseEntry {
    pub name: String,
    #[serde(default)]
    pub sets: Vec<SetEntry>,
}

/// A recorded workout ("séance"). Stored over time in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    /// Optional canonical type (push / pull / skip) — only the seeded sessions
    /// carry it; user-created ones may omit it.
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    #[serde(default)]
    pub seance: String,
    pub name: String,
    /// ISO-8601 timestamp.
    pub date: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub exercises: Vec<ExerciseEntry>,
    #[serde(default)]
    pub volume: f64,
    #[serde(default)]
    pub duration: f64,
}

/// Reference "séance type": a reusable name + colour used in the régularité grid.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeanceRef {
    pub id: String,
    pub name: String,
    pub color: String,
}

/// Reference "exercice type": a name + targeted muscle group + optional note.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseRef {
    pub id: String,
    pub name: String,
    /// Groupe musculaire (optionnel).
    #[serde(default)]
    pub muscle: String,
    /// Commentaire (optionnel).
    #[serde(default)]
    pub comment: String,
}

/// The user account. The password is **never** stored in clear — only its
/// Argon2 hash — and is stripped before crossing to the front (see [`PublicUser`]).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub name: String,
    pub email: String,
    #[serde(default)]
    pub password_hash: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub gender: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub weight: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub age: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Photo de profil : chemin du fichier image sur le disque (référence).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
}

/// The user without any credential material — the only shape sent to the front.
#[derive(Debug, Clone, Serialize)]
pub struct PublicUser {
    pub name: String,
    pub email: String,
    pub gender: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub age: Option<f64>,
    pub language: Option<String>,
    pub avatar: Option<String>,
}

impl From<&User> for PublicUser {
    fn from(u: &User) -> Self {
        PublicUser {
            name: u.name.clone(),
            email: u.email.clone(),
            gender: u.gender.clone(),
            height: u.height,
            weight: u.weight,
            age: u.age,
            language: u.language.clone(),
            avatar: u.avatar.clone(),
        }
    }
}

/// The whole persisted database — a single JSON document on disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Database {
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default)]
    pub user: Option<User>,
    #[serde(default)]
    pub seance_refs: Vec<SeanceRef>,
    #[serde(default)]
    pub exercise_refs: Vec<ExerciseRef>,
    #[serde(default)]
    pub sessions: Vec<Session>,
}

impl Default for Database {
    fn default() -> Self {
        Database {
            version: SCHEMA_VERSION,
            user: None,
            seance_refs: Vec::new(),
            exercise_refs: Vec::new(),
            sessions: Vec::new(),
        }
    }
}

/// Subset of the database shipped as the first-launch seed (refs + sessions).
#[derive(Debug, Clone, Deserialize)]
pub struct Seed {
    #[serde(default)]
    pub seance_refs: Vec<SeanceRef>,
    #[serde(default)]
    pub exercise_refs: Vec<ExerciseRef>,
    #[serde(default)]
    pub sessions: Vec<Session>,
}

/// Everything the front needs in one round-trip at startup.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Bootstrap {
    pub user: Option<PublicUser>,
    pub seance_refs: Vec<SeanceRef>,
    pub exercise_refs: Vec<ExerciseRef>,
    pub sessions: Vec<Session>,
    pub app_version: String,
}

/// Payload sent by the front when saving a new session. The backend assigns the
/// id and (re)computes the volume so that business logic stays server-side.
#[derive(Debug, Clone, Deserialize)]
pub struct NewSession {
    #[serde(rename = "type", default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub seance: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub date: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub exercises: Vec<ExerciseEntry>,
    #[serde(default)]
    pub duration: f64,
}
