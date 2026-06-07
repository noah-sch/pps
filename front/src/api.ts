// ── Typed bridge to the Rust backend (Tauri commands) ───────────────────────
// Every persistent read/write goes through these wrappers, which call the
// `#[tauri::command]` functions registered in src-tauri/src/lib.rs.

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type {
  Bootstrap,
  ExerciseRef,
  NewSession,
  PublicUser,
  SeanceRef,
  Session,
} from "./types";

/** Load user + references + sessions in one round-trip at startup. */
export const bootstrap = () => invoke<Bootstrap>("bootstrap");

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signup = (name: string, email: string, password: string) =>
  invoke<PublicUser>("signup", { name, email, password });

export const login = (email: string, password: string) =>
  invoke<PublicUser>("login", { email, password });

export const updateProfile = (patch: Partial<PublicUser>) =>
  invoke<PublicUser>("update_profile", {
    name: patch.name ?? null,
    gender: patch.gender ?? null,
    height: patch.height ?? null,
    weight: patch.weight ?? null,
    age: patch.age ?? null,
    language: patch.language ?? null,
    avatar: patch.avatar ?? null,
  });

// ── Photo de profil ───────────────────────────────────────────────────────────
/** Native image picker. Returns the absolute file path, or null if cancelled. */
export const pickImageFile = async (): Promise<string | null> => {
  const sel = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: "Image",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "heic", "bmp"],
      },
    ],
  });
  return typeof sel === "string" ? sel : null;
};

/** Turn an absolute file path into a URL the webview can render (asset protocol). */
export const fileUrl = (path: string) => convertFileSrc(path);

// ── Séance references ─────────────────────────────────────────────────────────
// Returns the updated session list: renaming a reference is propagated to the
// recorded sessions server-side, so the history must be refreshed.
export const saveSeanceRefs = (refs: SeanceRef[]) =>
  invoke<Session[]>("save_seance_refs", { refs });

// ── Exercise references ───────────────────────────────────────────────────────
export const saveExerciseRefs = (refs: ExerciseRef[]) =>
  invoke<Session[]>("save_exercise_refs", { refs });

// ── Sessions ──────────────────────────────────────────────────────────────────
export const addSession = (session: NewSession) =>
  invoke<Session[]>("add_session", { session });

export const updateSession = (id: string, session: NewSession) =>
  invoke<Session[]>("update_session", { id, session });

export const deleteSession = (id: string) =>
  invoke<Session[]>("delete_session", { id });
