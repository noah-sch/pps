//! Tauri commands — the typed API exposed to the React front via `invoke()`.
//! Every command locks the shared [`Store`], mutates the in-memory database,
//! and persists to disk before returning.

use tauri::State;
use uuid::Uuid;

use crate::auth;
use crate::models::*;
use crate::store::{Store, StoreState};

fn new_id(prefix: &str) -> String {
    format!("{prefix}_{}", Uuid::new_v4().simple())
}

/// Round volume to the nearest integer like the original prototype did.
fn compute_volume(exercises: &[ExerciseEntry]) -> f64 {
    exercises
        .iter()
        .flat_map(|e| e.sets.iter())
        .map(|s| s.reps * s.weight)
        .sum::<f64>()
        .round()
}

fn sort_sessions(sessions: &mut [Session]) {
    // Most recent first; ISO-8601 strings sort lexicographically by time.
    sessions.sort_by(|a, b| b.date.cmp(&a.date));
}

/// Compare an old vs new reference list by id and return `(old_name, new_name)`
/// for every entry whose name changed (blank old names are ignored). Used to
/// propagate reference renames into the recorded sessions.
fn collect_renames<T>(
    old: &[T],
    new: &[T],
    key: impl Fn(&T) -> (&str, &str),
) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for n in new {
        let (nid, nname) = key(n);
        if let Some(o) = old.iter().find(|o| key(o).0 == nid) {
            let oname = key(o).1;
            if oname != nname && !oname.trim().is_empty() {
                out.push((oname.to_string(), nname.to_string()));
            }
        }
    }
    out
}

fn lock<'a>(state: &'a State<StoreState>) -> Result<std::sync::MutexGuard<'a, Store>, String> {
    state.lock().map_err(|_| "store lock poisoned".to_string())
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

/// Everything the front needs at startup in a single round-trip.
#[tauri::command]
pub fn bootstrap(state: State<StoreState>) -> Result<Bootstrap, String> {
    let store = lock(&state)?;
    let mut sessions = store.db.sessions.clone();
    sort_sessions(&mut sessions);
    Ok(Bootstrap {
        user: store.db.user.as_ref().map(PublicUser::from),
        seance_refs: store.db.seance_refs.clone(),
        exercise_refs: store.db.exercise_refs.clone(),
        sessions,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

// ── Auth ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn signup(
    state: State<StoreState>,
    name: String,
    email: String,
    password: String,
) -> Result<PublicUser, String> {
    let name = name.trim().to_string();
    let email = email.trim().to_lowercase();
    if email.is_empty() || password.is_empty() {
        return Err("Email et mot de passe requis.".into());
    }
    let mut store = lock(&state)?;
    if store.db.user.is_some() {
        return Err("Un compte existe déjà sur cet appareil.".into());
    }
    let user = User {
        name: if name.is_empty() { "Alex".into() } else { name },
        email,
        password_hash: auth::hash_password(&password)?,
        gender: None,
        height: None,
        weight: None,
        age: None,
        language: None,
        avatar: None,
    };
    let public = PublicUser::from(&user);
    store.db.user = Some(user);
    store.persist()?;
    Ok(public)
}

#[tauri::command]
pub fn login(
    state: State<StoreState>,
    email: String,
    password: String,
) -> Result<PublicUser, String> {
    let email = email.trim().to_lowercase();
    let store = lock(&state)?;
    match &store.db.user {
        Some(u) if u.email == email && auth::verify_password(&password, &u.password_hash) => {
            Ok(PublicUser::from(u))
        }
        _ => Err("Identifiants invalides.".into()),
    }
}

#[tauri::command]
pub fn update_profile(
    state: State<StoreState>,
    name: Option<String>,
    gender: Option<String>,
    height: Option<f64>,
    weight: Option<f64>,
    age: Option<f64>,
    language: Option<String>,
    avatar: Option<String>,
) -> Result<PublicUser, String> {
    let mut store = lock(&state)?;
    let user = store
        .db
        .user
        .as_mut()
        .ok_or_else(|| "Aucun compte enregistré.".to_string())?;
    if let Some(n) = name {
        if !n.trim().is_empty() {
            user.name = n.trim().to_string();
        }
    }
    user.gender = gender;
    user.height = height;
    user.weight = weight;
    user.age = age;
    user.language = language;
    user.avatar = avatar;
    let public = PublicUser::from(&*user);
    store.persist()?;
    Ok(public)
}

// ── Séance references ───────────────────────────────────────────────────────

/// Replace the whole séance-reference list (the Références editor saves in bulk).
/// Renaming a reference (matched by id) is propagated to every session that used
/// the old name, so the history stays in sync. Returns the updated, sorted
/// session list.
#[tauri::command]
pub fn save_seance_refs(
    state: State<StoreState>,
    refs: Vec<SeanceRef>,
) -> Result<Vec<Session>, String> {
    let mut store = lock(&state)?;
    let renames = collect_renames(&store.db.seance_refs, &refs, |r| {
        (r.id.as_str(), r.name.as_str())
    });
    for (old, new) in &renames {
        for s in &mut store.db.sessions {
            if s.name == *old {
                s.name = new.clone();
            }
            if s.seance == *old {
                s.seance = new.clone();
            }
        }
    }
    store.db.seance_refs = refs;
    let mut sessions = store.db.sessions.clone();
    sort_sessions(&mut sessions);
    store.persist()?;
    Ok(sessions)
}

// ── Exercise references ─────────────────────────────────────────────────────

/// Replace the whole exercise-reference list. Renaming an exercise reference
/// (matched by id) is propagated to every matching exercise entry across all
/// recorded sessions. Returns the updated, sorted session list.
#[tauri::command]
pub fn save_exercise_refs(
    state: State<StoreState>,
    refs: Vec<ExerciseRef>,
) -> Result<Vec<Session>, String> {
    let mut store = lock(&state)?;
    let renames = collect_renames(&store.db.exercise_refs, &refs, |r| {
        (r.id.as_str(), r.name.as_str())
    });
    for (old, new) in &renames {
        for s in &mut store.db.sessions {
            for e in &mut s.exercises {
                if e.name == *old {
                    e.name = new.clone();
                }
            }
        }
    }
    store.db.exercise_refs = refs;
    let mut sessions = store.db.sessions.clone();
    sort_sessions(&mut sessions);
    store.persist()?;
    Ok(sessions)
}

// ── Sessions ────────────────────────────────────────────────────────────────

/// Persist a new session. The backend assigns the id and recomputes the volume
/// from the sets, then returns the full, sorted session list.
#[tauri::command]
pub fn add_session(state: State<StoreState>, session: NewSession) -> Result<Vec<Session>, String> {
    let cleaned: Vec<ExerciseEntry> = session
        .exercises
        .into_iter()
        .filter(|e| !e.name.trim().is_empty())
        .map(|e| ExerciseEntry {
            name: e.name,
            sets: e
                .sets
                .into_iter()
                .filter(|s| s.reps > 0.0 && s.weight > 0.0)
                .collect(),
        })
        .filter(|e| !e.sets.is_empty())
        .collect();

    let name = if session.name.trim().is_empty() {
        "Séance du jour".to_string()
    } else {
        session.name.trim().to_string()
    };

    let record = Session {
        id: new_id("s"),
        kind: session.kind,
        seance: if session.seance.trim().is_empty() {
            name.clone()
        } else {
            session.seance.trim().to_string()
        },
        name,
        date: session.date,
        description: session.description,
        volume: compute_volume(&cleaned),
        duration: if session.duration > 0.0 {
            session.duration
        } else {
            60.0
        },
        exercises: cleaned,
    };

    let mut store = lock(&state)?;
    store.db.sessions.insert(0, record);
    sort_sessions(&mut store.db.sessions);
    store.persist()?;
    Ok(store.db.sessions.clone())
}

/// Update an existing session in place (its id is preserved). Exercises are
/// cleaned and the volume recomputed exactly like [`add_session`]. Returns the
/// full, sorted session list.
#[tauri::command]
pub fn update_session(
    state: State<StoreState>,
    id: String,
    session: NewSession,
) -> Result<Vec<Session>, String> {
    let cleaned: Vec<ExerciseEntry> = session
        .exercises
        .into_iter()
        .filter(|e| !e.name.trim().is_empty())
        .map(|e| ExerciseEntry {
            name: e.name,
            sets: e
                .sets
                .into_iter()
                .filter(|s| s.reps > 0.0 && s.weight > 0.0)
                .collect(),
        })
        .filter(|e| !e.sets.is_empty())
        .collect();

    let name = if session.name.trim().is_empty() {
        "Séance du jour".to_string()
    } else {
        session.name.trim().to_string()
    };
    let seance = if session.seance.trim().is_empty() {
        name.clone()
    } else {
        session.seance.trim().to_string()
    };

    let mut store = lock(&state)?;
    let Some(idx) = store.db.sessions.iter().position(|s| s.id == id) else {
        return Err("Séance introuvable.".into());
    };
    {
        let s = &mut store.db.sessions[idx];
        s.kind = session.kind;
        s.seance = seance;
        s.name = name;
        s.date = session.date;
        s.description = session.description;
        s.volume = compute_volume(&cleaned);
        s.duration = if session.duration > 0.0 {
            session.duration
        } else {
            60.0
        };
        s.exercises = cleaned;
    }
    sort_sessions(&mut store.db.sessions);
    let sessions = store.db.sessions.clone();
    store.persist()?;
    Ok(sessions)
}

#[tauri::command]
pub fn delete_session(state: State<StoreState>, id: String) -> Result<Vec<Session>, String> {
    let mut store = lock(&state)?;
    store.db.sessions.retain(|s| s.id != id);
    let mut sessions = store.db.sessions.clone();
    sort_sessions(&mut sessions);
    store.persist()?;
    Ok(sessions)
}
