// ── Derived view-model + formatting helpers ─────────────────────────────────
// Faithful port of the reference data.js derivation: everything the dashboards
// and hero preview display is recomputed here from the persisted sessions, so
// it stays correct as the user adds or removes workouts.

import type {
  CalendarDay,
  Derived,
  Pr,
  SeriesPoint,
  Session,
  Stats,
  WeekPoint,
} from "./types";

export const TYPES: Record<
  string,
  { key: string; label: string; desc: string }
> = {
  push: { key: "push", label: "Push", desc: "Pecs · épaules · triceps" },
  pull: { key: "pull", label: "Pull", desc: "Dos · biceps" },
  skip: { key: "skip", label: "Skip", desc: "Jambes · fessiers · mollets" },
};

const DAY_MS = 864e5;

// Locale active pour le formatage des dates/mois. Pilotée par la langue choisie
// (voir setLocale, appelé depuis App au changement de langue). Le reste du
// rendu passe par les helpers fmt* ci-dessous, donc tout suit la langue.
let LOCALE = "fr-FR";
export function setLocale(lang: string) {
  LOCALE = lang === "en" ? "en-GB" : "fr-FR";
}

/** Key lifts tracked as personal records, in display order. */
const PR_LIFTS = [
  "Développé couché",
  "Squat",
  "Soulevé de terre roumain",
  "Tractions",
  "Développé militaire",
  "Rowing barre",
];

/** Top single-set weight reached for a lift across all sessions. */
function progressionSeries(sessions: Session[], lift: string): SeriesPoint[] {
  return sessions
    .filter((s) => s.exercises.some((e) => e.name === lift))
    .map((s) => {
      const e = s.exercises.find((x) => x.name === lift)!;
      const top = Math.max(...e.sets.map((st) => st.weight));
      return { date: s.date, value: top };
    })
    .reverse();
}

/**
 * Compute the full derived view-model from the session list.
 * `now` defaults to the real current date so the rolling windows and activity
 * calendar always end "today".
 */
export function derive(sessions: Session[], now: Date = new Date()): Derived {
  // Personal records — best single-set weight per key lift.
  const prs: Pr[] = PR_LIFTS.map((lift) => {
    let best = 0;
    let when: string | null = null;
    sessions.forEach((s) =>
      s.exercises.forEach((e) => {
        if (e.name === lift)
          e.sets.forEach((st) => {
            if (st.weight > best) {
              best = st.weight;
              when = s.date;
            }
          });
      }),
    );
    return { lift, weight: best, date: when };
  });

  // Weekly volume — rolling 7-day windows ending today (last 8).
  const weeks: WeekPoint[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7 + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const vol = sessions
      .filter((s) => {
        const sd = new Date(s.date);
        return sd >= start && sd < end;
      })
      .reduce((a, s) => a + s.volume, 0);
    const weekPrefix = LOCALE.startsWith("en") ? "W" : "S";
    weeks.push({ label: weekPrefix + (8 - w), volume: vol });
  }

  const benchSeries = progressionSeries(sessions, "Développé couché");
  const squatSeries = progressionSeries(sessions, "Squat");

  // Activity calendar — last 70 days.
  const calendar: CalendarDay[] = [];
  for (let i = 69; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const hit = sessions.find((s) => {
      const sd = new Date(s.date);
      return sd.toDateString() === d.toDateString();
    });
    calendar.push({
      date: d.toISOString(),
      type: hit ? hit.type ?? null : null,
      seance: hit ? hit.seance : null,
    });
  }

  // Current streak — consecutive recent weeks that contain a session.
  const streakWeeks = (() => {
    const weekHit: Record<number, boolean> = {};
    calendar.forEach((c) => {
      if (c.seance || c.type) {
        const wk = Math.floor(
          (now.getTime() - new Date(c.date).getTime()) / (7 * DAY_MS),
        );
        weekHit[wk] = true;
      }
    });
    let streak = 0;
    let wk = 0;
    while (weekHit[wk]) {
      streak++;
      wk++;
    }
    return streak;
  })();

  const totalVolume = sessions.reduce((a, s) => a + s.volume, 0);
  const stats: Stats = {
    totalSessions: sessions.length,
    totalVolume,
    thisWeekVol: weeks[weeks.length - 1].volume,
    lastWeekVol: weeks[weeks.length - 2].volume,
    streakWeeks,
    avgDuration: sessions.length
      ? Math.round(sessions.reduce((a, s) => a + s.duration, 0) / sessions.length)
      : 0,
  };

  return { prs, weeks, benchSeries, squatSeries, calendar, stats };
}

// ── Formatting helpers ──────────────────────────────────────────────────────

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(
    LOCALE,
    opts || { day: "numeric", month: "short" },
  );
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Month + year label (used to group the history), localised. */
export function fmtMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    month: "long",
    year: "numeric",
  });
}

export function fmtVol(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(1).replace(".0", "") + "k" : "" + v;
}

/** Safe max for possibly-empty progression series. */
export function maxValue(series: SeriesPoint[]): number {
  return series.length ? Math.max(...series.map((d) => d.value)) : 0;
}
