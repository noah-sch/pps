// ── Push Pull Skip — Suivi & Analyse ────────────────────────────────────────
// Deux sous-onglets :
//  1) Suivi séances : grille de régularité (tooltip jour + séance + groupes
//     musculaires), volume total éditorial + 3 stats, volume hebdo en carte.
//  2) Analyse : graphe interactif des performances d'un exercice (3 modes de
//     valeur, filtre de dates, tooltip par série) + records de charge par exo.
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Card, Label, Segmented } from "./components";
import { fmtDate, fmtVol } from "./derive";
import { useT } from "./i18n";
import type { Derived, ExerciseRef, SeanceRef, Session } from "./types";

type Props = {
  derived: Derived;
  sessions: Session[];
  seanceRefs: SeanceRef[];
  exerciseRefs: ExerciseRef[];
};

export function TrackingPage(props: Props) {
  const t = useT();
  const [tab, setTab] = useState("sessions");
  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="mb-2">{t("Performances")}</Label>
          <h1
            className="font-serif text-[clamp(2rem,5vw,2.9rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("Suivi")}
          </h1>
        </div>
        <Segmented
          options={[
            { value: "sessions", label: t("Suivi séances") },
            { value: "analysis", label: t("Analyse") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "analysis" ? <Analysis {...props} /> : <SessionTracking {...props} />}
    </div>
  );
}

// ── Sous-onglet 1 : Suivi séances ───────────────────────────────────────────
function SessionTracking({ derived, sessions, seanceRefs, exerciseRefs }: Props) {
  const t = useT();
  const { stats, weeks, calendar } = derived;

  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    seanceRefs.forEach((r) => (m[r.name] = r.color));
    return (name: string | null) => (name && m[name]) || "var(--muted)";
  }, [seanceRefs]);

  // nom d'exercice (insensible à la casse) → groupe musculaire
  const muscleOf = useMemo(() => {
    const m = new Map<string, string>();
    exerciseRefs.forEach((r) => {
      if (r.muscle.trim()) m.set(r.name.toLowerCase(), r.muscle.trim());
    });
    return m;
  }, [exerciseRefs]);

  // jour (toDateString) → séance enregistrée ce jour-là
  const sessionByDay = useMemo(() => {
    const m = new Map<string, Session>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      if (!m.has(key)) m.set(key, s);
    });
    return m;
  }, [sessions]);

  const musclesOf = (s: Session) => [
    ...new Set(
      s.exercises
        .map((e) => muscleOf.get(e.name.toLowerCase()))
        .filter((x): x is string => !!x),
    ),
  ];

  // découpe le calendrier (70 j) en colonnes de 7 jours
  const cols: typeof calendar[] = [];
  for (let i = 0; i < calendar.length; i += 7) cols.push(calendar.slice(i, i + 7));
  const cell = 18;

  return (
    <div className="flex flex-col gap-9">
      {/* Régularité — grande grille avec tooltip au survol */}
      <Card transparent className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Label>{t("Régularité")}</Label>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {seanceRefs.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 font-sans text-[11px] text-muted"
              >
                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{ background: r.color }}
                />
                {r.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-[5px] overflow-x-auto pb-2">
          {cols.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[5px]">
              {week.map((day, di) => {
                const trained = !!(day.seance || day.type);
                const sess = sessionByDay.get(new Date(day.date).toDateString());
                const muscles = sess ? musclesOf(sess) : [];
                return (
                  <div key={di} className="group relative">
                    <div
                      className="rounded-[4px] border border-line/50 transition group-hover:ring-2 group-hover:ring-ink/30"
                      style={{
                        width: cell,
                        height: cell,
                        background: trained ? colorOf(day.seance) : "var(--cream)",
                        opacity: trained ? 1 : 0.5,
                      }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 group-hover:block">
                      <div className="whitespace-nowrap rounded-xl border border-line bg-paper px-3.5 py-2.5 shadow-xl">
                        <div className="font-sans text-[12px] font-semibold text-ink">
                          {fmtDate(day.date, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                        {trained && sess ? (
                          <>
                            <div className="mt-1 flex items-center gap-1.5 font-sans text-[12.5px] text-ink/85">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: colorOf(day.seance) }}
                              />
                              {sess.name}
                            </div>
                            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
                              {muscles.length ? muscles.join(" · ") : "—"}
                            </div>
                          </>
                        ) : (
                          <div className="mt-1 font-sans text-[11.5px] text-muted">
                            {t("Pas de séance")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Volume total (éditorial) + 3 stats */}
      <div>
        <div className="border-y border-line py-9 text-center">
          <Label>{t("Volume cumulé · 8 semaines")}</Label>
          <div className="mt-4 font-serif text-[clamp(3rem,12vw,6rem)] font-medium leading-[0.9] tracking-[-0.03em] text-ink">
            {Math.round(stats.totalVolume).toLocaleString()}
            <span className="ml-2 align-baseline text-[0.32em] text-accent">
              kg
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { v: stats.totalSessions, l: t("séances enregistrées") },
            {
              v: `${stats.streakWeeks} ${t("sem.")}`,
              l: t("de régularité d'affilée"),
            },
            { v: `${stats.avgDuration} min`, l: t("de durée moyenne") },
          ].map((x) => (
            <div key={x.l} className="px-6 py-7 text-center">
              <div className="font-serif text-[40px] leading-none text-ink">
                {x.v}
              </div>
              <p className="mt-2 font-sans text-[13px] text-muted">{x.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Volume hebdomadaire (carte) */}
      <Card transparent className="p-6">
        <Label>{t("Volume hebdomadaire")}</Label>
        <div className="mb-4 mt-1.5 flex items-baseline gap-2">
          <span className="whitespace-nowrap font-serif text-[28px] text-ink">
            {fmtVol(stats.totalVolume)} kg
          </span>
          <span className="font-sans text-[12px] text-muted">
            {t("cumulé sur 8 semaines")}
          </span>
        </div>
        <BarChart data={weeks} height={160} />
      </Card>
    </div>
  );
}

// ── Sous-onglet 2 : Analyse ─────────────────────────────────────────────────
type Mode = "weight" | "setload" | "total";
type APoint = {
  date: string;
  value: number;
  sets: { reps: number; weight: number }[];
};

function Analysis({ sessions }: Props) {
  const t = useT();
  const today = new Date().toLocaleDateString("en-CA");

  const exercises = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.name)))].sort(),
    [sessions],
  );
  // exercice le plus fréquent par défaut
  const defaultEx = useMemo(() => {
    const count = new Map<string, number>();
    sessions.forEach((s) =>
      new Set(s.exercises.map((e) => e.name)).forEach((n) =>
        count.set(n, (count.get(n) || 0) + 1),
      ),
    );
    let best = "";
    let bn = -1;
    count.forEach((c, n) => {
      if (c > bn) {
        bn = c;
        best = n;
      }
    });
    return best;
  }, [sessions]);
  const minDay = useMemo(() => {
    const days = sessions
      .map((s) => new Date(s.date).toLocaleDateString("en-CA"))
      .sort();
    return days[0] ?? today;
  }, [sessions, today]);

  const [exercise, setExercise] = useState(() => defaultEx);
  const [mode, setMode] = useState<Mode>("weight");
  const [from, setFrom] = useState(() => minDay);
  const [to, setTo] = useState(today);

  // Records de charge (poids max sur une série, tous temps) par exercice
  const records = useMemo(() => {
    const m = new Map<string, { weight: number; date: string }>();
    sessions.forEach((s) =>
      s.exercises.forEach((e) =>
        e.sets.forEach((st) => {
          const cur = m.get(e.name);
          if (!cur || st.weight > cur.weight)
            m.set(e.name, { weight: st.weight, date: s.date });
        }),
      ),
    );
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.weight - a.weight);
  }, [sessions]);

  // Points du graphe pour l'exercice + plage de dates + mode choisis
  const points = useMemo<APoint[]>(() => {
    const out: APoint[] = [];
    for (const s of sessions) {
      const ex = s.exercises.find((e) => e.name === exercise);
      if (!ex || !ex.sets.length) continue;
      const day = new Date(s.date).toLocaleDateString("en-CA");
      if (from && day < from) continue;
      if (to && day > to) continue;
      const value =
        mode === "weight"
          ? Math.max(...ex.sets.map((st) => st.weight))
          : mode === "setload"
            ? Math.max(...ex.sets.map((st) => st.reps * st.weight))
            : ex.sets.reduce((a, st) => a + st.reps * st.weight, 0);
      out.push({ date: s.date, value, sets: ex.sets });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, exercise, from, to, mode]);

  if (!exercises.length) {
    return (
      <div className="rounded-card border border-dashed border-line px-5 py-16 text-center font-sans text-[14px] text-muted">
        {t("Aucun exercice enregistré pour l'instant.")}
      </div>
    );
  }

  const unit = mode === "weight" ? "kg" : "";

  return (
    <div className="flex flex-col gap-8">
      {/* Filtres */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <Label className="mb-2">{t("Exercice")}</Label>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 font-sans text-[15px] text-ink outline-none transition focus:border-ink/50 focus:bg-paper"
            >
              {exercises.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-2">{t("Valeur affichée")}</Label>
            <Segmented
              options={[
                { value: "weight", label: t("Poids") },
                { value: "setload", label: t("Charge / série") },
                { value: "total", label: t("Charge totale") },
              ]}
              value={mode}
              onChange={(v) => setMode(v as Mode)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <div>
            <Label className="mb-2">{t("Du")}</Label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 font-sans text-[14px] text-ink outline-none transition focus:border-ink/50 focus:bg-paper"
            />
          </div>
          <div>
            <Label className="mb-2">{t("Au")}</Label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 font-sans text-[14px] text-ink outline-none transition focus:border-ink/50 focus:bg-paper"
            />
          </div>
        </div>
      </div>

      {/* Graphe */}
      <Card transparent className="p-5 sm:p-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <Label>{exercise}</Label>
          <span className="font-mono text-[11px] text-muted">
            {t("{n} points", { n: points.length })}
          </span>
        </div>
        <AnalysisChart points={points} unit={unit} />
      </Card>

      {/* Records de charge par exercice */}
      <div>
        <Label className="mb-1">{t("Records de charge")}</Label>
        <p className="mb-4 font-sans text-[13px] text-ink/55">
          {t("Poids maximum porté sur une série, par exercice (tous temps).")}
        </p>
        <div className="border-t border-line">
          {records.map((r) => (
            <div
              key={r.name}
              className={`flex items-baseline justify-between gap-3 border-b border-line py-3 ${
                r.name === exercise ? "bg-cream/40" : ""
              }`}
            >
              <span className="min-w-0 flex-1 truncate font-sans text-[14.5px] text-ink/85">
                {r.name}
              </span>
              <span className="shrink-0 font-mono text-[12px] text-muted">
                {fmtDate(r.date)}
              </span>
              <span className="w-20 shrink-0 whitespace-nowrap text-right font-mono text-[16px] font-medium text-ink">
                {r.weight} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Graphe d'analyse (SVG interactif) ───────────────────────────────────────
function AnalysisChart({ points, unit }: { points: APoint[]; unit: string }) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(680);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const H = 300;
  const pad = { l: 46, r: 18, t: 18, b: 30 };
  const n = points.length;

  if (!n) {
    return (
      <div className="flex h-[300px] items-center justify-center font-sans text-[13.5px] text-muted">
        {t("Aucune donnée pour cet exercice sur cette période.")}
      </div>
    );
  }

  const iw = Math.max(1, w - pad.l - pad.r);
  const ih = H - pad.t - pad.b;
  const vals = points.map((p) => p.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const span = rawMax - rawMin || rawMax || 1;
  const lo = Math.max(0, rawMin - span * 0.15);
  const hi = rawMax + span * 0.15;

  const xAt = (i: number) =>
    pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const yAt = (v: number) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih;

  const line = points
    .map((p, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${xAt(n - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} L${xAt(
    0,
  ).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;

  const gridN = 4;
  const grid = Array.from({ length: gridN + 1 }, (_, i) => lo + ((hi - lo) * i) / gridN);

  const onMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const idx = n <= 1 ? 0 : Math.round((mx / (rect.width || 1)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const hp = hover != null ? points[hover] : null;
  const hx = hover != null ? xAt(hover) : 0;
  const tipLeft = Math.max(78, Math.min(w - 78, hx));

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg width={w} height={H} className="block">
        <defs>
          <linearGradient id="ana-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grille + axes Y */}
        {grid.map((g, i) => {
          const y = yAt(g);
          return (
            <g key={i}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
                strokeOpacity={i === 0 ? 1 : 0.5}
              />
              <text
                x={pad.l - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-muted font-mono"
                style={{ fontSize: 10 }}
              >
                {fmtVol(Math.round(g))}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#ana-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(p.value)}
            r={hover === i ? 5 : 3}
            fill="var(--paper)"
            stroke="var(--accent)"
            strokeWidth="2"
          />
        ))}

        {/* repère vertical au survol */}
        {hp && (
          <line
            x1={hx}
            x2={hx}
            y1={pad.t}
            y2={pad.t + ih}
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
        )}

        {/* étiquettes X : première / dernière date */}
        <text
          x={pad.l}
          y={H - 8}
          textAnchor="start"
          className="fill-muted font-mono"
          style={{ fontSize: 10 }}
        >
          {fmtDate(points[0].date)}
        </text>
        {n > 1 && (
          <text
            x={w - pad.r}
            y={H - 8}
            textAnchor="end"
            className="fill-muted font-mono"
            style={{ fontSize: 10 }}
          >
            {fmtDate(points[n - 1].date)}
          </text>
        )}

        {/* zone de capture du survol */}
        <rect
          x={pad.l}
          y={pad.t}
          width={iw}
          height={ih}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {/* tooltip */}
      {hp && (
        <div
          className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-xl border border-line bg-paper px-3.5 py-2.5 shadow-xl"
          style={{ left: tipLeft }}
        >
          <div className="font-sans text-[12px] font-semibold text-ink">
            {fmtDate(hp.date, { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="mb-1 font-mono text-[12.5px] text-accent">
            {fmtVol(hp.value)}
            {unit ? ` ${unit}` : ""}
          </div>
          <div className="flex flex-col gap-0.5">
            {hp.sets.map((st, i) => (
              <div
                key={i}
                className="whitespace-nowrap font-mono text-[11.5px] text-ink/70"
              >
                {t("Série {n}", { n: i + 1 })} : {st.reps}×{st.weight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
