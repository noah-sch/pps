// ── Shared front-end types — mirror the Rust structs in src-tauri/src/models.rs

export interface SetEntry {
  reps: number;
  weight: number;
}

export interface ExerciseEntry {
  name: string;
  sets: SetEntry[];
}

/** A recorded workout ("séance"). */
export interface Session {
  id: string;
  type?: string | null;
  seance: string;
  name: string;
  /** ISO-8601 timestamp. */
  date: string;
  description: string;
  exercises: ExerciseEntry[];
  volume: number;
  duration: number;
}

/** Reference "séance type": reusable name + colour. */
export interface SeanceRef {
  id: string;
  name: string;
  color: string;
  /** Ordered exercise names (each must exist in the exercise refs) used to
   *  pre-fill a new session created from this template. */
  exercises: string[];
}

/** Reference "exercice type": name + muscle group (optional) + note (optional). */
export interface ExerciseRef {
  id: string;
  name: string;
  muscle: string;
  comment: string;
}

/** The user account as seen by the front (never carries the password hash). */
export interface PublicUser {
  name: string;
  email: string;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  language?: string | null;
  /** Profile picture: absolute path of the image file on disk (reference). */
  avatar?: string | null;
}

/** Everything fetched in one round-trip at startup. */
export interface Bootstrap {
  user: PublicUser | null;
  seanceRefs: SeanceRef[];
  exerciseRefs: ExerciseRef[];
  sessions: Session[];
  appVersion: string;
}

/** Payload sent to the backend when saving a new session. */
export interface NewSession {
  type?: string | null;
  seance: string;
  name: string;
  date: string;
  description: string;
  exercises: ExerciseEntry[];
  duration: number;
}

// ── Routing ──────────────────────────────────────────────────────────────────

export type RouteName =
  | "landing"
  | "auth"
  | "faq"
  | "history"
  | "add"
  | "references"
  | "timer"
  | "tracking"
  | "profile";

export interface RouteParams {
  mode?: "login" | "signup";
  /** Id of the session being edited (history → edit flow). */
  editId?: string;
  [key: string]: unknown;
}

export type Nav = (name: RouteName, params?: RouteParams) => void;

// ── Derived, read-only view-model computed from sessions ─────────────────────

export interface Pr {
  lift: string;
  weight: number;
  date: string | null;
}

export interface WeekPoint {
  label: string;
  volume: number;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface CalendarDay {
  date: string;
  type: string | null;
  seance: string | null;
}

export interface Stats {
  totalSessions: number;
  totalVolume: number;
  thisWeekVol: number;
  lastWeekVol: number;
  streakWeeks: number;
  avgDuration: number;
}

export interface Derived {
  prs: Pr[];
  weeks: WeekPoint[];
  benchSeries: SeriesPoint[];
  squatSeries: SeriesPoint[];
  calendar: CalendarDay[];
  stats: Stats;
}
