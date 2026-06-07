// ── Push Pull Skip — internationalisation (FR base + EN) ────────────────────
// Approche « texte source FR = clé » : on enveloppe chaque chaîne visible dans
// t("…français…"). En anglais, on cherche la traduction dans EN ; si elle
// manque, on retombe sur le français — rien ne s'affiche jamais vide.
//
// Le titre/marque « Push Pull Skip » (et son sigle « PPS ») n'est JAMAIS traduit
// et n'a donc pas d'entrée ici : il est rendu tel quel par le composant Wordmark.

import { createContext, useContext, type ReactNode } from "react";

export type Lang = "fr" | "en";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

// Traductions anglaises indexées par la chaîne française source.
// Toute clé absente retombe automatiquement sur le français.
const EN: Record<string, string> = {
  // ── Navigation / shell ──
  Historique: "History",
  Ajouter: "Add",
  Références: "References",
  Chrono: "Stopwatch",
  Suivi: "Tracking",
  "Mon profil": "My profile",
  "Se déconnecter": "Log out",
  Performances: "Performance",
  // ── Toasts ──
  "Séance enregistrée ✓": "Session saved ✓",
  "Séance supprimée ✓": "Session deleted ✓",
  "Profil enregistré ✓": "Profile saved ✓",
  "Erreur : {e}": "Error: {e}",
  // ── Historique / séance ──
  "{n} séances": "{n} sessions",
  "Nouvelle séance": "New session",
  Tout: "All",
  "{n} exos": "{n} exercises",
  "{n} min": "{n} min",
  "{n} kg vol.": "{n} kg vol.",
  "{n} séries": "{n} sets",
  "Volume total": "Total volume",
  "Supprimer cette séance ?": "Delete this session?",
  Annuler: "Cancel",
  Supprimer: "Delete",
  "Supprimer la séance": "Delete session",
  Modifier: "Edit",
  "Modifier la séance": "Edit session",
  "Enregistrer les modifications": "Save changes",
  "Séance mise à jour ✓": "Session updated ✓",
  // ── Ajouter une séance ──
  "Nouvelle entrée": "New entry",
  "Ajouter une séance": "Add a session",
  "Nom de la séance": "Session name",
  "Push, Pull, Jambes…": "Push, Pull, Legs…",
  Date: "Date",
  "Heure d'arrivée": "Arrival time",
  Description: "Description",
  "Ressenti, objectif, note du jour…": "Feeling, goal, note of the day…",
  Exercices: "Exercises",
  "reps × charge (kg)": "reps × load (kg)",
  reps: "reps",
  "Ajouter une série": "Add a set",
  "Ajouter un exercice": "Add an exercise",
  "Enregistrer la séance": "Save session",
  // ── Chronomètre ──
  "Pendant la séance": "During the session",
  Repos: "Rest",
  Tour: "Lap",
  Réinitialiser: "Reset",
  Pause: "Pause",
  Démarrer: "Start",
  Tours: "Laps",
  "Tour {n}": "Lap {n}",
  Terminé: "Done",
  Lancer: "Start",
  Durée: "Duration",
  Minutes: "Minutes",
  Secondes: "Seconds",
  s: "s",
  // ── Dashboard / suivi ──
  Régularité: "Consistency",
  min: "min",
  "Volume hebdomadaire": "Weekly volume",
  "cumulé sur 8 semaines": "cumulative over 8 weeks",
  "Volume cumulé · 8 semaines": "Cumulative volume · 8 weeks",
  "séances enregistrées": "sessions logged",
  "de régularité d'affilée": "of consistency in a row",
  "de durée moyenne": "average duration",
  // ── Suivi & Analyse ──
  "Suivi séances": "Session tracking",
  Analyse: "Analysis",
  "Pas de séance": "No session",
  Exercice: "Exercise",
  "Valeur affichée": "Displayed value",
  Poids: "Weight",
  "Charge / série": "Load / set",
  "Charge totale": "Total load",
  Du: "From",
  Au: "To",
  "{n} points": "{n} points",
  "Records de charge": "Strength records",
  "Poids maximum porté sur une série, par exercice (tous temps).":
    "Heaviest weight lifted on a single set, per exercise (all-time).",
  "Aucune donnée pour cet exercice sur cette période.":
    "No data for this exercise in this range.",
  "Aucun exercice enregistré pour l'instant.": "No exercise recorded yet.",
  "Série {n}": "Set {n}",
  // ── Références ──
  "Tes repères": "Your benchmarks",
  "Enregistre tes séances et tes exercices types. Ils te seront proposés automatiquement au moment d'ajouter une séance. Chaque séance porte une couleur, reprise dans la grille de régularité.":
    "Save your session and exercise templates. They'll be suggested automatically when you add a session. Each session carries a colour, reused in the consistency grid.",
  "Séances · {n}": "Sessions · {n}",
  "Exercices · {n}": "Exercises · {n}",
  "Nouvelle séance type": "New session template",
  "ex. Push, Full body, Cardio…": "e.g. Push, Full body, Cardio…",
  "Aucune séance type pour l'instant.": "No session templates yet.",
  "Nouvel exercice type": "New exercise template",
  "Nom de l'exercice": "Exercise name",
  "Groupe musculaire": "Muscle group",
  "Commentaire (optionnel) — technique, consigne…":
    "Comment (optional) — technique, cue…",
  "Ajouter un commentaire…": "Add a comment…",
  "Aucun exercice type pour l'instant.": "No exercise templates yet.",
  "ex. Pectoraux": "e.g. Chest",
  "Ajouter « ": "Add « ",
  " » aux références": " » to references",
  "Groupe musculaire ciblé par « ": "Muscle group targeted by « ",
  " »": " »",
  // ── Accueil / public ──
  "Volume · 7 jours": "Volume · 7 days",
  "sem.": "wk",
  "Aucune séance enregistrée.": "No session logged yet.",
  FAQ: "FAQ",
  "Se connecter": "Log in",
  "Système d'entraînement": "Training system",
  "Enregistrement / Suivi / Analyse": "Logging / Tracking / Analysis",
  Nouveau: "New",
  "Créer un compte": "Create an account",
  "Déjà membre": "Already a member",
  "Carnet d'entraînement": "Training journal",
  // ── Connexion / inscription ──
  "Bon retour.": "Welcome back.",
  "On commence ?": "Ready to start?",
  "Reprends là où tu t'es arrêté.": "Pick up right where you left off.",
  "Crée ton carnet en quelques secondes.": "Set up your journal in seconds.",
  Connexion: "Log in",
  Inscription: "Sign up",
  Prénom: "First name",
  Alex: "Alex",
  Email: "Email",
  "alex@exemple.fr": "alex@example.com",
  "Mot de passe": "Password",
  "Oublié ?": "Forgot it?",
  "8 caractères min.": "8 characters min.",
  "Créer mon compte": "Create my account",
  // ── FAQ ──
  Aide: "Help",
  "Questions fréquentes": "Frequently asked questions",
  "Enregistre tes séances.": "Log your workouts.",
  "C'est quoi Push Pull Skip ?": "What is Push Pull Skip?",
  "Un carnet d'entraînement structuré pour tes séances à la salle. Tu enregistres chaque séance par type en spécifiant les exercices que tu as réalisés, et l'application suit ta progression dans le temps.":
    "A training journal built around gym routine. You log each session by type with the exercises you've completed, and the app tracks your progress over time.",
  "Comment je suis mes performances ?": "How do I track my performance?",
  "Chaque séance enregistre tes exercices, séries, reps et charges. L'app calcule automatiquement ton volume, tes records personnels (PR), ta régularité et l'évolution de tes charges semaine après semaine.":
    "Every session records your exercises, sets, reps and loads. The app automatically computes your volume, your personal records (PRs), your consistency and how your loads evolve week after week.",
  "Le chronomètre sert à quoi ?": "What is the timer for?",
  "À gérer tes temps de repos entre les séries et à chronométrer ta séance. Tu peux lancer, mettre en pause et marquer des tours pour comparer tes séries.":
    "To manage your rest times between sets and to time your session. You can start, pause and mark laps to compare your sets.",
  "Puis-je personnaliser mes séances ?": "Can I customise my sessions?",
  "Oui. PPS couvre tous les types de séances : tu nommes librement chaque séance et tu ajoutes les exercices de ton choix, avec leurs séries et leurs charges.":
    "Yes. PPS covers all types of sessions: you can name each session freely and add whatever exercises you like, with their sets and loads.",
  "Mes données sont-elles enregistrées ?": "Is my data saved?",
  "Oui. Tes séances, références et ton compte sont stockés localement sur ton appareil, dans une base de données JSON gérée par l'application.":
    "Yes. Your sessions, references and account are stored locally on your device, in a JSON database managed by the app.",
  // ── Profil ──
  "Ton compte": "Your account",
  "Choisir une photo": "Choose a photo",
  "Retirer la photo": "Remove photo",
  Genre: "Gender",
  "Non précisé": "Unspecified",
  Homme: "Male",
  Femme: "Female",
  Autre: "Other",
  "Taille (cm)": "Height (cm)",
  "Poids (kg)": "Weight (kg)",
  Langue: "Language",
  Thème: "Theme",
  Clair: "Light",
  Sombre: "Dark",
  "Enregistrer le profil": "Save profile",
  Âge: "Age",
  // ── Onboarding ──
  "Passer pour l'instant": "Skip for now",
  Passer: "Skip",
  Continuer: "Continue",
  Terminer: "Finish",
  "Étape {n}/2": "Step {n}/2",
  "Bienvenue {name} !": "Welcome {name}!",
  "Quelques infos pour personnaliser ton suivi — facultatif, tu pourras les modifier plus tard.":
    "A few details to personalise your tracking — optional, you can change them later.",
};

const DICTS: Record<Lang, Record<string, string>> = {
  fr: {}, // identité : on renvoie la clé (le français)
  en: EN,
};

/** Pure translation (no hook) — usable outside components, e.g. for toasts. */
export function translate(
  lang: Lang,
  fr: string,
  vars?: Record<string, string | number>,
): string {
  let out = lang === "fr" ? fr : DICTS[lang][fr] ?? fr;
  if (vars) {
    for (const k of Object.keys(vars)) {
      out = out.split(`{${k}}`).join(String(vars[k]));
    }
  }
  return out;
}

const I18nContext = createContext<Lang>("fr");

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={lang}>{children}</I18nContext.Provider>;
}

export function useLang(): Lang {
  return useContext(I18nContext);
}

/**
 * Hook de traduction. Retourne `t(fr, vars?)` :
 *   t("Historique")                  → "History" en EN, "Historique" en FR
 *   t("{n} séances", { n: 12 })      → "12 sessions" / "12 séances"
 * Les variables `{clé}` présentes dans la chaîne sont remplacées.
 */
export function useT() {
  const lang = useContext(I18nContext);
  return (fr: string, vars?: Record<string, string | number>): string =>
    translate(lang, fr, vars);
}
