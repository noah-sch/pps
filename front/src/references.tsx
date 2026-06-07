// ── Push Pull Skip — Références (séances + exercices) ───────────────────────
import { useEffect, useRef, useState } from "react";
import {
  Button,
  ColorSwatch,
  PageHead,
  REF_COLORS,
  Segmented,
} from "./components";
import { Icons } from "./icons";
import { useT } from "./i18n";
import type { ExerciseRef, SeanceRef } from "./types";

export const MUSCLE_GROUPS = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Ischio-jambiers",
  "Fessiers",
  "Mollets",
  "Abdominaux",
  "Avant-bras",
  "Trapèzes",
  "Cardio",
];

export const newId = () =>
  "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// Close a pop-over when the user interacts outside of `ref`. Used by the
// comboboxes below: a click-outside listener instead of a full-screen overlay,
// so the text input underneath stays editable while the suggestions are open.
function useCloseOnOutside(
  ref: { readonly current: HTMLElement | null },
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, ref, close]);
}

// ── Combobox: séance name ──────────────────────────────────────────────────
// value/onChange control the text. onAddRef(name) creates + returns a new ref.
export function SeanceCombo({
  value,
  onChange,
  seanceRefs,
  onAddRef,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  seanceRefs: SeanceRef[];
  onAddRef: (name: string) => SeanceRef;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const q = (value || "").trim().toLowerCase();
  const matches = seanceRefs.filter((r) => r.name.toLowerCase().includes(q));
  const exact = seanceRefs.some((r) => r.name.toLowerCase() === q);
  const showAdd = (value || "").trim() && !exact;
  useCloseOnOutside(boxRef, open, () => setOpen(false));

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };
  const add = () => {
    const r = onAddRef(value.trim());
    onChange(r.name);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (showAdd) add();
            else setOpen(false);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder || t("Nom de la séance")}
        className="w-full rounded-xl border border-line bg-cream/40 px-4 py-3 font-sans text-[15px] text-ink placeholder:text-muted/70 outline-none transition focus:border-ink/50 focus:bg-paper"
      />
      {open && (matches.length > 0 || showAdd) && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-xl">
            {matches.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => choose(r.name)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left font-sans text-[14px] text-ink transition hover:bg-cream/70"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: r.color }}
                />
                {r.name}
              </button>
            ))}
            {showAdd && (
              <button
                type="button"
                onClick={add}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left font-sans text-[13.5px] text-ink/70 transition hover:bg-cream/70 ${
                  matches.length ? "border-t border-line/70" : ""
                }`}
              >
                <Icons.Plus size={15} className="text-accent" />
                {t("Ajouter « ")}
                <span className="font-medium text-ink">{value.trim()}</span>
                {t(" » aux références")}
              </button>
            )}
        </div>
      )}
    </div>
  );
}

// ── Combobox: exercise name (add flow captures the muscle group) ───────────
export function ExerciseCombo({
  value,
  onChange,
  exerciseRefs,
  onAddRef,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  exerciseRefs: ExerciseRef[];
  onAddRef: (name: string, muscle: string) => ExerciseRef;
  placeholder?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [muscle, setMuscle] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const q = (value || "").trim().toLowerCase();
  const matches = exerciseRefs.filter((r) => r.name.toLowerCase().includes(q));
  const exact = exerciseRefs.some((r) => r.name.toLowerCase() === q);
  const showAdd = (value || "").trim() && !exact;

  const close = () => {
    setOpen(false);
    setAdding(false);
    setMuscle("");
  };
  useCloseOnOutside(boxRef, open, close);
  const choose = (name: string) => {
    onChange(name);
    close();
  };
  const confirmAdd = () => {
    onAddRef(value.trim(), muscle.trim());
    onChange(value.trim());
    close();
  };

  return (
    <div className="relative flex-1" ref={boxRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setAdding(false);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            close();
          } else if (e.key === "Escape") {
            close();
          }
        }}
        placeholder={placeholder || t("Nom de l'exercice")}
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-[15px] font-medium text-ink outline-none focus:border-ink/40"
      />
      {open && (matches.length > 0 || showAdd) && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-xl">
            {matches.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => choose(r.name)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-cream/70"
              >
                <span className="font-sans text-[14px] text-ink">{r.name}</span>
                {r.muscle && (
                  <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                    {r.muscle}
                  </span>
                )}
              </button>
            ))}
            {showAdd && !adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left font-sans text-[13.5px] text-ink/70 transition hover:bg-cream/70 ${
                  matches.length ? "border-t border-line/70" : ""
                }`}
              >
                <Icons.Plus size={15} className="text-accent" />
                {t("Ajouter « ")}
                <span className="font-medium text-ink">{value.trim()}</span>
                {t(" » aux références")}
              </button>
            )}
            {showAdd && adding && (
              <div
                className={`px-4 py-3 ${
                  matches.length ? "border-t border-line/70" : ""
                }`}
              >
                <div className="mb-2 font-sans text-[12px] text-muted">
                  {t("Groupe musculaire ciblé par « ")}
                  <span className="font-medium text-ink">{value.trim()}</span>
                  {t(" »")}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    list="muscle-groups"
                    value={muscle}
                    onChange={(e) => setMuscle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAdd();
                    }}
                    placeholder={t("ex. Pectoraux")}
                    className="flex-1 rounded-lg border border-line bg-cream/40 px-3 py-2 font-sans text-[14px] text-ink outline-none focus:border-ink/40 focus:bg-paper"
                  />
                  <Button variant="solid" size="sm" onClick={confirmAdd}>
                    <Icons.Check size={15} /> {t("Ajouter")}
                  </Button>
                </div>
              </div>
            )}
        </div>
      )}
      <datalist id="muscle-groups">
        {MUSCLE_GROUPS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}

// ── Références page ─────────────────────────────────────────────────────────
export function ReferencesPage({
  seanceRefs,
  setSeanceRefs,
  exerciseRefs,
  setExerciseRefs,
}: {
  seanceRefs: SeanceRef[];
  setSeanceRefs: React.Dispatch<React.SetStateAction<SeanceRef[]>>;
  exerciseRefs: ExerciseRef[];
  setExerciseRefs: React.Dispatch<React.SetStateAction<ExerciseRef[]>>;
}) {
  const t = useT();
  const [tab, setTab] = useState("seances");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHead overline={t("Tes repères")} title={t("Références")} />
      <p className="-mt-4 mb-8 max-w-xl font-sans text-[14px] leading-relaxed text-ink/55">
        {t(
          "Enregistre tes séances et tes exercices types. Ils te seront proposés automatiquement au moment d'ajouter une séance. Chaque séance porte une couleur, reprise dans la grille de régularité.",
        )}
      </p>

      <div className="mb-8">
        <Segmented
          options={[
            { value: "seances", label: t("Séances · {n}", { n: seanceRefs.length }) },
            { value: "exercices", label: t("Exercices · {n}", { n: exerciseRefs.length }) },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "seances" ? (
        <SeanceRefs refs={seanceRefs} setRefs={setSeanceRefs} />
      ) : (
        <ExerciseRefs refs={exerciseRefs} setRefs={setExerciseRefs} />
      )}
    </div>
  );
}

function SeanceRefs({
  refs,
  setRefs,
}: {
  refs: SeanceRef[];
  setRefs: React.Dispatch<React.SetStateAction<SeanceRef[]>>;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [color, setColor] = useState(REF_COLORS[refs.length % REF_COLORS.length]);
  const update = (id: string, patch: Partial<SeanceRef>) =>
    setRefs((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRefs((p) => p.filter((r) => r.id !== id));
  const add = () => {
    const n = name.trim();
    if (!n) return;
    setRefs((p) => [...p, { id: newId(), name: n, color }]);
    setName("");
    setColor(REF_COLORS[(refs.length + 1) % REF_COLORS.length]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-line bg-cream/40 p-4">
        <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("Nouvelle séance type")}
        </div>
        <div className="flex items-center gap-3">
          <ColorSwatch color={color} onChange={setColor} size={40} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={t("ex. Push, Full body, Cardio…")}
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 font-sans text-[15px] text-ink placeholder:text-muted/70 outline-none focus:border-ink/40"
          />
          <Button variant="solid" size="base" onClick={add} disabled={!name.trim()}>
            <Icons.Plus size={16} /> {t("Ajouter")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {refs.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-card border border-line bg-paper px-4 py-3"
          >
            <ColorSwatch
              color={r.color}
              onChange={(c) => update(r.id, { color: c })}
              size={28}
            />
            <input
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1.5 font-serif text-[18px] text-ink outline-none transition hover:border-line focus:border-ink/30 focus:bg-cream/40"
            />
            <button
              onClick={() => remove(r.id)}
              className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-ink/5 hover:text-ink"
              title={t("Supprimer")}
            >
              <Icons.Trash size={17} />
            </button>
          </div>
        ))}
        {refs.length === 0 && (
          <EmptyRef label={t("Aucune séance type pour l'instant.")} />
        )}
      </div>
    </div>
  );
}

function ExerciseRefs({
  refs,
  setRefs,
}: {
  refs: ExerciseRef[];
  setRefs: React.Dispatch<React.SetStateAction<ExerciseRef[]>>;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [comment, setComment] = useState("");
  const update = (id: string, patch: Partial<ExerciseRef>) =>
    setRefs((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRefs((p) => p.filter((r) => r.id !== id));
  const add = () => {
    const n = name.trim();
    if (!n) return;
    setRefs((p) => [
      ...p,
      { id: newId(), name: n, muscle: muscle.trim(), comment: comment.trim() },
    ]);
    setName("");
    setMuscle("");
    setComment("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-line bg-cream/40 p-4">
        <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("Nouvel exercice type")}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Nom de l'exercice")}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 font-sans text-[15px] font-medium text-ink placeholder:text-muted/70 outline-none focus:border-ink/40"
            />
            <input
              list="muscle-groups"
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              placeholder={t("Groupe musculaire")}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 font-sans text-[15px] text-ink placeholder:text-muted/70 outline-none focus:border-ink/40"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              placeholder={t("Commentaire (optionnel) — technique, consigne…")}
              className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-muted/70 outline-none focus:border-ink/40"
            />
            <Button variant="solid" size="base" onClick={add} disabled={!name.trim()}>
              <Icons.Plus size={16} /> {t("Ajouter")}
            </Button>
          </div>
        </div>
        <datalist id="muscle-groups">
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2.5">
        {refs.map((r) => (
          <div key={r.id} className="rounded-card border border-line bg-paper p-4">
            <div className="flex items-center gap-3">
              <input
                value={r.name}
                onChange={(e) => update(r.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 font-sans text-[15.5px] font-semibold text-ink outline-none transition hover:border-line focus:border-ink/30 focus:bg-cream/40"
              />
              <input
                list="muscle-groups"
                value={r.muscle}
                onChange={(e) => update(r.id, { muscle: e.target.value })}
                placeholder="—"
                className="w-40 shrink-0 rounded-lg border border-transparent bg-cream/40 px-2.5 py-1 text-right font-mono text-[11px] uppercase tracking-[0.1em] text-muted outline-none transition hover:border-line focus:border-ink/30 focus:text-ink"
              />
              <button
                onClick={() => remove(r.id)}
                className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-ink/5 hover:text-ink"
                title={t("Supprimer")}
              >
                <Icons.Trash size={17} />
              </button>
            </div>
            <input
              value={r.comment}
              onChange={(e) => update(r.id, { comment: e.target.value })}
              placeholder={t("Ajouter un commentaire…")}
              className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-serif text-[14px] italic text-ink/60 placeholder:not-italic placeholder:text-muted/60 outline-none transition hover:border-line focus:border-ink/30 focus:bg-cream/40"
            />
          </div>
        ))}
        {refs.length === 0 && (
          <EmptyRef label={t("Aucun exercice type pour l'instant.")} />
        )}
      </div>
    </div>
  );
}

function EmptyRef({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-dashed border-line px-5 py-10 text-center font-sans text-[14px] text-muted">
      {label}
    </div>
  );
}
