// ── Push Pull Skip — app pages (logged in) ──────────────────────────────────
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Card,
  Divider,
  Field,
  Input,
  Label,
  PageHead,
  Segmented,
  Textarea,
} from "./components";
import { Icons } from "./icons";
import { useT } from "./i18n";
import { SeanceCombo, ExerciseCombo } from "./references";
import { fmtDate, fmtTime, fmtVol } from "./derive";
import type {
  ExerciseRef,
  Nav,
  NewSession,
  SeanceRef,
  Session,
} from "./types";

// ── Historique ─────────────────────────────────────────────────────────────
export function HistoryPage({
  sessions,
  nav,
  seanceRefs,
  onDelete,
}: {
  sessions: Session[];
  nav: Nav;
  seanceRefs: SeanceRef[];
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const colorMap: Record<string, string> = {};
  (seanceRefs || []).forEach((r) => {
    colorMap[r.name] = r.color;
  });
  const colorOf = (s: Session) => colorMap[s.name] || "var(--muted)";
  const names = [...new Set(sessions.map((s) => s.name))];
  const filtered =
    filter === "all" ? sessions : sessions.filter((s) => s.name === filter);

  // group by month
  const groups = useMemo(() => {
    const m: Record<string, Session[]> = {};
    filtered.forEach((s) => {
      const key = new Date(s.date).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      (m[key] = m[key] || []).push(s);
    });
    return Object.entries(m);
  }, [filtered]);

  return (
    <div>
      <PageHead overline={t("{n} séances", { n: sessions.length })} title={t("Historique")}>
        <Button variant="solid" size="base" onClick={() => nav("add")}>
          <Icons.Plus size={17} /> {t("Nouvelle séance")}
        </Button>
      </PageHead>

      <div className="mb-8">
        <Segmented
          options={[
            { value: "all", label: t("Tout") },
            ...names.map((n) => ({
              value: n,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: colorMap[n] || "var(--muted)" }}
                  />
                  {n}
                </span>
              ),
            })),
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {groups.map(([month, items]) => (
        <div key={month} className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <Label>{month}</Label>
            <Divider className="flex-1" />
          </div>
          <div className="flex flex-col gap-3">
            {items.map((s) => (
              <SessionRow
                key={s.id}
                s={s}
                color={colorOf(s)}
                open={openId === s.id}
                onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                onEdit={() => nav("add", { editId: s.id })}
                onDelete={() => onDelete(s.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionRow({
  s,
  color,
  open,
  onToggle,
  onEdit,
  onDelete,
}: {
  s: Session;
  color: string;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  // Reset the delete confirmation when the row collapses — adjusted during
  // render (React's recommended alternative to an effect for this).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setConfirming(false);
  }
  return (
    <Card
      transparent
      className="overflow-hidden transition-colors hover:border-ink/25"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6"
      >
        {/* date block */}
        <div className="flex w-12 shrink-0 flex-col items-center">
          <span className="font-serif text-[24px] leading-none text-ink">
            {new Date(s.date).getDate()}
          </span>
          <span className="mt-1 font-sans text-[10px] uppercase tracking-wide text-muted">
            {fmtDate(s.date, { month: "short" })}
          </span>
        </div>
        <div className="h-10 w-px bg-line" />
        {/* main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span className="truncate font-serif text-[18px] text-ink">
              {s.name}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-sans text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Icons.Clock size={13} /> {fmtTime(s.date)}
            </span>
            <span>{t("{n} exos", { n: s.exercises.length })}</span>
            <span>{t("{n} min", { n: s.duration })}</span>
            <span className="font-mono text-ink/60">
              {t("{n} kg vol.", { n: fmtVol(s.volume) })}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        >
          <Icons.Arrow size={18} />
        </span>
      </button>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line bg-cream/30 px-5 py-5 sm:px-6">
            {s.description && (
              <p className="mb-5 font-serif text-[15px] italic leading-relaxed text-ink/60">
                « {s.description} »
              </p>
            )}
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {s.exercises.map((e, i) => {
                const maxW = Math.max(...e.sets.map((x) => x.weight));
                return (
                  <div key={i}>
                    <div className="flex items-start justify-between gap-3 border-b border-ink/15 pb-1.5">
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[11px] text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-sans text-[14px] font-semibold leading-snug text-ink">
                          {e.name}
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                        {t("{n} séries", { n: e.sets.length })}
                      </span>
                    </div>
                    <div className="mt-1">
                      {e.sets.map((st, j) => {
                        const top = st.weight === maxW;
                        return (
                          <div
                            key={j}
                            className="grid grid-cols-[1.4rem_1fr_auto] items-baseline border-b border-line/50 py-[7px] font-mono text-[13px] tabular-nums"
                          >
                            <span className="text-[11px] text-muted">
                              {String(j + 1).padStart(2, "0")}
                            </span>
                            <span className="text-ink/70">
                              {st.reps}
                              <span className="ml-1 text-[11px] text-muted">
                                reps
                              </span>
                            </span>
                            <span
                              className={`flex items-center justify-end gap-1.5 ${
                                top ? "text-accent" : "text-ink/85"
                              }`}
                            >
                              {top && (
                                <span className="h-1 w-1 rounded-full bg-accent" />
                              )}
                              {st.weight}
                              <span className="text-[11px] text-muted">kg</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-ink/15 pt-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
                {t("Volume total")}
              </span>
              <span className="font-mono text-[14px] tabular-nums text-ink">
                {fmtVol(s.volume)} kg
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-[12.5px] font-medium text-muted transition hover:bg-ink/5 hover:text-ink"
              >
                <Icons.Edit size={15} /> {t("Modifier")}
              </button>
              {confirming ? (
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[12.5px] text-muted">
                    {t("Supprimer cette séance ?")}
                  </span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-lg px-3 py-1.5 font-sans text-[12.5px] font-medium text-ink/60 transition hover:bg-ink/5 hover:text-ink"
                  >
                    {t("Annuler")}
                  </button>
                  <button
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 font-sans text-[12.5px] font-medium text-paper transition hover:bg-red-600"
                  >
                    <Icons.Trash size={14} /> {t("Supprimer")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  title={t("Supprimer la séance")}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-[12.5px] font-medium text-muted transition hover:bg-red-600/10 hover:text-red-600"
                >
                  <Icons.Trash size={15} /> {t("Supprimer")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Ajouter une session ────────────────────────────────────────────────────
type DraftSet = { reps: string; weight: string };
type DraftExercise = { name: string; sets: DraftSet[] };

export function AddSessionPage({
  nav,
  onSave,
  onUpdate,
  editSession,
  seanceRefs,
  exerciseRefs,
  addSeanceRef,
  addExerciseRef,
}: {
  nav: Nav;
  onSave: (s: NewSession) => void;
  onUpdate: (id: string, s: NewSession) => void;
  editSession: Session | null;
  seanceRefs: SeanceRef[];
  exerciseRefs: ExerciseRef[];
  addSeanceRef: (name: string) => SeanceRef;
  addExerciseRef: (name: string, muscle: string) => ExerciseRef;
}) {
  const t = useT();
  const editing = !!editSession;
  // Prefill from the edited session (this component is remounted per editId).
  const [name, setName] = useState(editSession?.name ?? "");
  const [date, setDate] = useState(
    editSession
      ? new Date(editSession.date).toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD (local)
  );
  const [time, setTime] = useState(() => {
    if (!editSession) return "18:30";
    const d = new Date(editSession.date);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`;
  });
  const [desc, setDesc] = useState(editSession?.description ?? "");
  const [exercises, setExercises] = useState<DraftExercise[]>(
    editSession && editSession.exercises.length
      ? editSession.exercises.map((e) => ({
          name: e.name,
          sets: e.sets.length
            ? e.sets.map((s) => ({
                reps: String(s.reps),
                weight: String(s.weight),
              }))
            : [{ reps: "", weight: "" }],
        }))
      : [{ name: "", sets: [{ reps: "", weight: "" }] }],
  );

  const updateEx = (i: number, key: "name", val: string) =>
    setExercises((ex) =>
      ex.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)),
    );
  const updateSet = (
    ei: number,
    si: number,
    key: keyof DraftSet,
    val: string,
  ) =>
    setExercises((ex) =>
      ex.map((e, idx) =>
        idx === ei
          ? {
              ...e,
              sets: e.sets.map((s, sj) =>
                sj === si ? { ...s, [key]: val } : s,
              ),
            }
          : e,
      ),
    );
  const addSet = (ei: number) =>
    setExercises((ex) =>
      ex.map((e, idx) =>
        idx === ei ? { ...e, sets: [...e.sets, { reps: "", weight: "" }] } : e,
      ),
    );
  const removeSet = (ei: number, si: number) =>
    setExercises((ex) =>
      ex.map((e, idx) =>
        idx === ei
          ? { ...e, sets: e.sets.filter((_, sj) => sj !== si) }
          : e,
      ),
    );
  const addEx = () =>
    setExercises((ex) => [...ex, { name: "", sets: [{ reps: "", weight: "" }] }]);
  const removeEx = (i: number) =>
    setExercises((ex) => ex.filter((_, idx) => idx !== i));

  const save = () => {
    const cleaned = exercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name,
        sets: e.sets
          .filter((s) => s.reps && s.weight)
          .map((s) => ({ reps: +s.reps, weight: +s.weight })),
      }))
      .filter((e) => e.sets.length);
    const sName = name.trim() || "Séance du jour";
    const payload: NewSession = {
      type: editSession?.type ?? null,
      seance: sName,
      name: sName,
      date: new Date(date + "T" + time).toISOString(),
      description: desc,
      exercises: cleaned,
      duration: editSession?.duration ?? 60,
    };
    if (editSession) onUpdate(editSession.id, payload);
    else onSave(payload);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHead
        overline={editing ? t("Modifier") : t("Nouvelle entrée")}
        title={editing ? t("Modifier la séance") : t("Ajouter une séance")}
      />

      <div className="flex flex-col gap-7">
        <Field label={t("Nom de la séance")}>
          <SeanceCombo
            value={name}
            onChange={setName}
            seanceRefs={seanceRefs}
            onAddRef={addSeanceRef}
            placeholder={t("Push, Pull, Jambes…")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("Date")}>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={t("Heure d'arrivée")}>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label={t("Description")}>
          <Textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t("Ressenti, objectif, note du jour…")}
          />
        </Field>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>{t("Exercices")}</Label>
            <span className="font-sans text-[11px] text-muted">
              {t("reps × charge (kg)")}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {exercises.map((ex, ei) => (
              <Card key={ei} className="bg-cream/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ExerciseCombo
                    value={ex.name}
                    onChange={(v) => updateEx(ei, "name", v)}
                    exerciseRefs={exerciseRefs}
                    onAddRef={addExerciseRef}
                  />
                  {exercises.length > 1 && (
                    <button
                      onClick={() => removeEx(ei)}
                      className="rounded-lg p-2 text-muted hover:bg-ink/5 hover:text-ink"
                    >
                      <Icons.X size={16} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {ex.sets.map((st, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-center font-mono text-[12px] text-muted">
                        {si + 1}
                      </span>
                      <input
                        type="number"
                        value={st.reps}
                        onChange={(e) => updateSet(ei, si, "reps", e.target.value)}
                        placeholder={t("reps")}
                        className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[14px] text-ink outline-none focus:border-ink/40"
                      />
                      <span className="font-mono text-muted">×</span>
                      <input
                        type="number"
                        value={st.weight}
                        onChange={(e) =>
                          updateSet(ei, si, "weight", e.target.value)
                        }
                        placeholder="kg"
                        className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[14px] text-ink outline-none focus:border-ink/40"
                      />
                      {ex.sets.length > 1 && (
                        <button
                          onClick={() => removeSet(ei, si)}
                          className="rounded-lg p-1.5 text-muted hover:text-ink"
                        >
                          <Icons.X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addSet(ei)}
                  className="mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-ink/60 hover:text-ink"
                >
                  <Icons.Plus size={14} /> {t("Ajouter une série")}
                </button>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            size="base"
            className="mt-4 w-full"
            onClick={addEx}
          >
            <Icons.Plus size={16} /> {t("Ajouter un exercice")}
          </Button>
        </div>

        <Divider />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => nav("history")}>
            {t("Annuler")}
          </Button>
          <Button variant="solid" size="base" onClick={save}>
            <Icons.Check size={17} />{" "}
            {editing
              ? t("Enregistrer les modifications")
              : t("Enregistrer la séance")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Chronomètre ────────────────────────────────────────────────────────────
export function TimerPage() {
  const t = useT();
  const [mode, setMode] = useState("stopwatch"); // stopwatch | rest
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      <div className="mb-14 w-full">
        <Label className="mb-4 text-center">{t("Pendant la séance")}</Label>
        <div className="flex justify-center">
          <Segmented
            options={[
              { value: "stopwatch", label: t("Chrono") },
              { value: "rest", label: t("Repos") },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
      </div>
      {mode === "stopwatch" ? <Stopwatch /> : <RestTimer />}
    </div>
  );
}

function fmtClock(ms: number) {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return {
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    cs: String(cs).padStart(2, "0"),
  };
}

function RoundBtn({
  children,
  onClick,
  variant = "outline",
  size = 64,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "accent" | "outline";
  size?: number;
  disabled?: boolean;
  label?: string;
}) {
  const styles = {
    primary: "bg-ink text-paper hover:bg-ink/90",
    accent: "bg-accent text-ink hover:brightness-[1.04]",
    outline:
      "border border-line bg-paper/40 text-ink/80 hover:border-ink/40 hover:text-ink",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

type Hand = { angle: number; inset: number; width: number; color: string };

function Dial({
  arc = 0,
  hands = [],
  smooth = false,
  done = false,
  ccw = false,
}: {
  arc?: number;
  hands?: Hand[];
  smooth?: boolean;
  done?: boolean;
  /** Dessine l'arc en sens anti-horaire (le bord qui se vide suit alors
   *  l'aiguille dans le sens horaire — utilisé par le minuteur de repos). */
  ccw?: boolean;
}) {
  const c = 160,
    R = 150;
  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const a = ((i * 6 - 90) * Math.PI) / 180;
      const r2 = R - (major ? 12 : 5);
      out.push(
        <line
          key={i}
          x1={(c + Math.cos(a) * R).toFixed(2)}
          y1={(c + Math.sin(a) * R).toFixed(2)}
          x2={(c + Math.cos(a) * r2).toFixed(2)}
          y2={(c + Math.sin(a) * r2).toFixed(2)}
          stroke="var(--line)"
          strokeWidth={major ? 1.5 : 1}
        />,
      );
    }
    return out;
  }, []);
  const Carc = 2 * Math.PI * R;
  const accent = done ? "var(--ink)" : "var(--accent)";
  return (
    <div className="relative" style={{ width: "min(76vw, 360px)", aspectRatio: "1 / 1" }}>
      <svg viewBox="0 0 320 320" width="100%" height="100%">
        {ticks}
        <circle
          cx={c}
          cy={c}
          r={R}
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={Carc}
          strokeDashoffset={Carc * (1 - Math.max(0, Math.min(1, arc)))}
          transform={
            ccw
              ? `translate(${2 * c} 0) scale(-1 1) rotate(-90 ${c} ${c})`
              : `rotate(-90 ${c} ${c})`
          }
          style={{
            transition: smooth
              ? "stroke-dashoffset 1s linear, stroke .3s"
              : "stroke .3s",
          }}
        />
        {hands.map((h, i) => (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={c}
            y2={c - (R - h.inset)}
            stroke={h.color}
            strokeWidth={h.width}
            strokeLinecap="round"
            style={{
              transformOrigin: "160px 160px",
              transform: `rotate(${h.angle}deg)`,
              transition: smooth ? "transform 1s linear" : "none",
            }}
          />
        ))}
        <circle cx={c} cy={c} r="4.5" fill="var(--ink)" />
        <circle cx={c} cy={c} r="1.8" fill="var(--paper)" />
      </svg>
    </div>
  );
}

function Stopwatch() {
  const tr = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<{ n: number; t: number }[]>([]);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  useEffect(() => {
    if (running) {
      start.current = performance.now() - elapsed;
      const tick = () => {
        setElapsed(performance.now() - start.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const t = fmtClock(elapsed);
  const secs = elapsed / 1000;
  const secAngle = (secs % 60) * 6;
  const minAngle = ((elapsed / 60000) % 60) * 6;
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };
  const lap = () => setLaps((l) => [{ n: l.length + 1, t: elapsed }, ...l]);

  return (
    <div className="flex w-full flex-col items-center">
      <Dial
        arc={(secs % 60) / 60}
        hands={[
          { angle: minAngle, inset: 72, width: 4, color: "var(--ink)" },
          { angle: secAngle, inset: 22, width: 2.5, color: "var(--accent)" },
        ]}
      />

      <div className="mt-8 flex items-baseline font-mono font-medium tabular-nums text-ink">
        <span className="text-[clamp(2.6rem,10vw,3.8rem)] leading-none tracking-tight">
          {t.m}:{t.s}
        </span>
        <span className="ml-1.5 text-[clamp(1rem,4vw,1.5rem)] leading-none text-muted">
          {t.cs}
        </span>
      </div>

      <div className="mt-9 flex items-center justify-center gap-6">
        {running && (
          <RoundBtn size={62} label={tr("Tour")} onClick={lap}>
            <Icons.Flag size={20} />
          </RoundBtn>
        )}
        {!running && elapsed > 0 && (
          <RoundBtn size={62} label={tr("Réinitialiser")} onClick={reset}>
            <Icons.X size={20} />
          </RoundBtn>
        )}
        <RoundBtn
          size={88}
          variant={running ? "primary" : "accent"}
          label={running ? tr("Pause") : tr("Démarrer")}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Icons.Pause size={30} /> : <Icons.Play size={30} />}
        </RoundBtn>
      </div>

      {laps.length > 0 && (
        <div className="mt-14 w-full max-w-sm">
          <div className="mb-1 flex items-center justify-between">
            <Label>{tr("Tours")}</Label>
            <Label>{laps.length}</Label>
          </div>
          <div className="max-h-64 overflow-y-auto border-t border-line">
            {laps.map((l) => {
              const lt = fmtClock(l.t);
              return (
                <div
                  key={l.n}
                  className="flex items-center justify-between border-b border-line/60 py-3"
                >
                  <span className="whitespace-nowrap font-mono text-[12.5px] uppercase tracking-[0.15em] text-muted">
                    {tr("Tour {n}", { n: String(l.n).padStart(2, "0") })}
                  </span>
                  <span className="font-mono text-[16px] tabular-nums text-ink">
                    {lt.m}:{lt.s}
                    <span className="text-muted">.{lt.cs}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Dernière durée de repos saisie, mémorisée pour la fois suivante.
const REST_KEY = "pps.restSeconds";
function loadRest(): number {
  try {
    const v = parseInt(localStorage.getItem(REST_KEY) || "", 10);
    if (Number.isFinite(v) && v >= 1) return v;
  } catch {
    /* stockage indisponible */
  }
  return 90;
}
function saveRest(sec: number) {
  try {
    localStorage.setItem(REST_KEY, String(sec));
  } catch {
    /* stockage indisponible */
  }
}

function RestTimer() {
  const t = useT();
  const [target, setTarget] = useState(loadRest);
  const [left, setLeft] = useState(target);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            if (ref.current) clearInterval(ref.current);
            setRunning(false);
            return 0;
          }
          return l - 1;
        });
      }, 1000);
      return () => {
        if (ref.current) clearInterval(ref.current);
      };
    }
  }, [running]);

  // Mémorise la dernière durée choisie pour la prochaine ouverture.
  useEffect(() => {
    saveRest(target);
  }, [target]);

  const setDuration = (minutes: number, seconds: number) => {
    const total = Math.max(1, Math.min(99 * 60 + 59, minutes * 60 + seconds));
    setTarget(total);
    setLeft(total);
    setRunning(false);
  };

  const mm = Math.floor(target / 60);
  const ss = target % 60;
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const frac = target ? left / target : 0;
  const done = left === 0;
  const handAngle = (1 - frac) * 360;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-10 flex flex-col items-center gap-2">
        <Label>{t("Durée")}</Label>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-cream/40 px-4 py-2.5">
          <input
            type="number"
            min={0}
            max={99}
            value={mm}
            disabled={running}
            onChange={(e) =>
              setDuration(
                Math.max(0, Math.min(99, parseInt(e.target.value || "0", 10) || 0)),
                ss,
              )
            }
            aria-label={t("Minutes")}
            className="w-12 bg-transparent text-right font-mono text-[20px] tabular-nums text-ink outline-none disabled:opacity-40"
          />
          <span className="font-sans text-[12px] text-muted">{t("min")}</span>
          <span className="font-mono text-[20px] text-muted">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={ss}
            disabled={running}
            onChange={(e) =>
              setDuration(
                mm,
                Math.max(0, Math.min(59, parseInt(e.target.value || "0", 10) || 0)),
              )
            }
            aria-label={t("Secondes")}
            className="w-12 bg-transparent font-mono text-[20px] tabular-nums text-ink outline-none disabled:opacity-40"
          />
          <span className="font-sans text-[12px] text-muted">{t("s")}</span>
        </div>
      </div>

      <Dial
        arc={frac}
        smooth
        ccw
        done={done}
        hands={[
          {
            angle: handAngle,
            inset: 22,
            width: 2.5,
            color: done ? "var(--ink)" : "var(--accent)",
          },
        ]}
      />

      <div className="mt-8 flex flex-col items-center">
        <span className="font-mono text-[clamp(2.8rem,11vw,4rem)] font-medium leading-none tabular-nums text-ink">
          {m}:{s}
        </span>
        <span className="mt-3 font-sans text-[11px] uppercase tracking-[0.22em] text-muted">
          {done ? t("Terminé") : t("Repos")}
        </span>
      </div>

      <div className="mt-9 flex items-center justify-center gap-6">
        <RoundBtn
          size={62}
          label={t("Réinitialiser")}
          onClick={() => {
            setLeft(target);
            setRunning(false);
          }}
        >
          <Icons.X size={20} />
        </RoundBtn>
        <RoundBtn
          size={88}
          variant="accent"
          label={running ? t("Pause") : t("Lancer")}
          disabled={done}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Icons.Pause size={30} /> : <Icons.Play size={30} />}
        </RoundBtn>
      </div>
    </div>
  );
}
