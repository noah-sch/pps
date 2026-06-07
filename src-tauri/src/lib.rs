//! Push Pull Skip — Tauri application core.
//!
//! Architecture:
//! - [`models`]   typed data model (serde structs shared with the front)
//! - [`store`]    isolated JSON data-access layer (app-data dir, atomic writes)
//! - [`auth`]     Argon2 password hashing / verification
//! - [`commands`] the `#[tauri::command]` API exposed to React via `invoke()`

mod auth;
mod commands;
mod models;
mod store;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Load (or seed) the JSON database and share it as managed state.
            let store = store::load(app.handle()).map_err(|e| {
                log::error!("failed to initialise database: {e}");
                std::io::Error::new(std::io::ErrorKind::Other, e)
            })?;
            app.manage(Mutex::new(store));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap,
            commands::signup,
            commands::login,
            commands::update_profile,
            commands::save_seance_refs,
            commands::save_exercise_refs,
            commands::add_session,
            commands::update_session,
            commands::delete_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
