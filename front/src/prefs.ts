// ── Préférences d'appareil (localStorage) ───────────────────────────────────
// « Se souvenir de moi » : on ne mémorise QU'UN DRAPEAU (jamais le mot de passe).
// S'il est actif et qu'un compte existe, l'app reconnecte automatiquement au
// lancement (voir App.tsx). Le mot de passe reste haché (Argon2) en base.

const REMEMBER_KEY = "pps.rememberMe";

/** Vrai si l'utilisateur veut rester connecté. Activé par défaut (jamais défini). */
export function getRemember(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_KEY);
    return v === null ? true : v === "1";
  } catch {
    return false;
  }
}

export function setRemember(on: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, on ? "1" : "0");
  } catch {
    /* stockage indisponible — préférence simplement ignorée */
  }
}
