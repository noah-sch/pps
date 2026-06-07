// ── Push Pull Skip — shared UI primitives ───────────────────────────────────
import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ElementType,
} from "react";
import { TYPES, fmtDate } from "./derive";
import type { CalendarDay, SeriesPoint, WeekPoint } from "./types";

// Wordmark ────────────────────────────────────────────────────────────────
export function Wordmark({
  size = "base",
  className = "",
}: {
  size?: "sm" | "base" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-[13px] tracking-[0.22em]",
    base: "text-[15px] tracking-[0.22em]",
    lg: "text-[20px] tracking-[0.2em]",
  };
  return (
    <span
      className={`font-mono font-medium uppercase text-ink ${sizes[size]} ${className}`}
    >
      PP<span className="text-accent">S</span>
    </span>
  );
}

// Section label (uppercase, spaced, muted) ─────────────────────────────────
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted ${className}`}
    >
      {children}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} />;
}

// Pill — the signature toggle from the reference ───────────────────────────
export function Pill({
  active,
  children,
  onClick,
  className = "",
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-[14px] font-medium transition-all duration-150 ${
        active
          ? "border-ink bg-ink text-paper shadow-sm"
          : "border-line bg-paper/60 text-ink/70 hover:border-ink/40 hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export type Option = string | { value: string; label: ReactNode };

// Segmented control (group of pills) ───────────────────────────────────────
export function Segmented({
  options,
  value,
  onChange,
  className = "",
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lab = typeof o === "string" ? o : o.label;
        return (
          <Pill key={val} active={value === val} onClick={() => onChange(val)}>
            {lab}
          </Pill>
        );
      })}
    </div>
  );
}

// Button ───────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = "solid",
  size = "base",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "accent" | "outline" | "ghost";
  size?: "sm" | "base" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none";
  const sizes = {
    sm: "px-4 py-2 text-[13px]",
    base: "px-5 py-2.5 text-[14px]",
    lg: "px-7 py-3.5 text-[15px]",
  };
  const variants = {
    solid: "bg-ink text-paper hover:bg-ink/90 active:scale-[0.98]",
    accent: "bg-accent text-ink hover:brightness-105 active:scale-[0.98]",
    outline: "border border-line bg-transparent text-ink hover:border-ink/50",
    ghost: "text-ink/70 hover:text-ink hover:bg-ink/[0.04]",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  as: As = "div",
  transparent = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  transparent?: boolean;
  [key: string]: unknown;
}) {
  return (
    <As
      className={`rounded-card border border-line ${
        transparent ? "" : "bg-paper"
      } ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

// Type badge (Push / Pull / Skip) with colored dot ─────────────────────────
export const TYPE_DOT: Record<string, string> = {
  push: "var(--accent)",
  pull: "var(--ink)",
  skip: "var(--sage)",
};

// Palette offered when picking a colour for a séance reference ──────────────
export const REF_COLORS = [
  "oklch(0.7 0.16 70)", // amber
  "oklch(0.58 0.13 255)", // blue
  "oklch(0.63 0.14 155)", // green
  "oklch(0.6 0.17 25)", // terracotta
  "oklch(0.6 0.14 320)", // magenta
  "oklch(0.6 0.05 250)", // slate
  "oklch(0.68 0.13 130)", // olive
  "oklch(0.67 0.15 45)", // orange
];

// Colour swatch with pop-over palette ──────────────────────────────────────
export function ColorSwatch({
  color,
  onChange,
  size = 24,
}: {
  color: string;
  onChange: (c: string) => void;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choisir une couleur"
        className="rounded-full border border-line shadow-sm transition hover:brightness-95"
        style={{ width: size, height: size, background: color }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-30 mt-2 grid grid-cols-4 gap-2 rounded-xl border border-line bg-paper p-3 shadow-xl">
            {REF_COLORS.map((c) => {
              const sel = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="h-6 w-6 rounded-full transition"
                  style={{
                    background: c,
                    boxShadow: sel
                      ? "0 0 0 2px var(--paper), 0 0 0 4px var(--ink)"
                      : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function TypeBadge({
  type,
  size = "base",
}: {
  type: string;
  size?: "sm" | "base";
}) {
  const t = TYPES[type];
  const cls = size === "sm" ? "text-[11px] px-2.5 py-1" : "text-[12px] px-3 py-1.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-cream/50 font-sans font-medium uppercase tracking-wide text-ink/80 ${cls}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: TYPE_DOT[type] }}
      />
      {t.label}
    </span>
  );
}

// Field (label + input) ────────────────────────────────────────────────────
export function Field({
  label,
  children,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label className="whitespace-nowrap">{label}</Label>
        {hint && (
          <span className="whitespace-nowrap font-sans text-[11px] text-muted">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-line bg-cream/40 px-4 py-3 font-sans text-[15px] text-ink placeholder:text-muted/70 outline-none transition focus:border-ink/50 focus:bg-paper ${
        props.className || ""
      }`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-xl border border-line bg-cream/40 px-4 py-3 font-sans text-[15px] leading-relaxed text-ink placeholder:text-muted/70 outline-none transition focus:border-ink/50 focus:bg-paper ${
        props.className || ""
      }`}
    />
  );
}

// ── Data viz (simple SVG) ──────────────────────────────────────────────────
export function LineChart({
  data,
  height = 120,
  accent = true,
  showDots = true,
}: {
  data: SeriesPoint[];
  height?: number;
  accent?: boolean;
  showDots?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  // No data points (e.g. the tracked lift isn't present in any session) — render
  // an empty placeholder rather than crashing on pts[-1] below.
  if (!data.length) {
    return (
      <div
        ref={ref}
        className="flex w-full items-center justify-center font-mono text-[12px] text-muted"
        style={{ height }}
      >
        —
      </div>
    );
  }
  const pad = { l: 6, r: 6, t: 12, b: 12 };
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const pts = data.map((d, i) => {
    const x =
      pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = pad.t + ih - ((d.value - min) / range) * ih;
    return [x, y];
  });
  const path = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${pad.t + ih} L${
    pts[0][0]
  },${pad.t + ih} Z`;
  const stroke = accent ? "var(--accent)" : "var(--ink)";
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lcg)" />
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots &&
          pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === pts.length - 1 ? 3.5 : 2}
              fill="var(--paper)"
              stroke={stroke}
              strokeWidth="1.6"
            />
          ))}
      </svg>
    </div>
  );
}

export function BarChart({
  data,
  height = 120,
  accentLast = true,
}: {
  data: WeekPoint[];
  height?: number;
  accentLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...data.map((d) => d.volume)) || 1;
  const gap = 8;
  const bw = (w - gap * (data.length - 1)) / data.length;
  const ih = height - 18;
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.volume / max) * ih);
          const x = i * (bw + gap);
          const last = i === data.length - 1;
          return (
            <g key={i}>
              <rect
                x={x}
                y={ih - h}
                width={bw}
                height={h}
                rx={Math.min(5, bw / 2)}
                fill={last && accentLast ? "var(--accent)" : "var(--ink)"}
                opacity={last && accentLast ? 1 : 0.82}
              />
              <text
                x={x + bw / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-muted font-sans"
                style={{ fontSize: 10 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Sparkline({
  data,
  color = "var(--ink)",
  width = 80,
  height = 28,
}: {
  data: number[] | SeriesPoint[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const vals = (data as (number | SeriesPoint)[]).map((d) =>
    typeof d === "number" ? d : d.value,
  );
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Activity calendar (heatmap of last 70 days) ──────────────────────────────
export function ActivityGrid({
  calendar,
  cell = 13,
  colors,
}: {
  calendar: CalendarDay[];
  cell?: number;
  colors?: Record<string, string>;
}) {
  // group into weeks (columns of 7)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendar.length; i += 7)
    weeks.push(calendar.slice(i, i + 7));
  const colorOf = (d: CalendarDay) => {
    const key = d.seance || d.type;
    if (!key) return "var(--cream)";
    if (colors && colors[key]) return colors[key];
    return (d.type && TYPE_DOT[d.type]) || "var(--muted)";
  };
  const labelOf = (d: CalendarDay) =>
    (d.seance || d.type ? (d.seance || "") + " — " : "") +
    fmtDate(d.date, { weekday: "short", day: "numeric", month: "short" });

  // Auto-scroll to the far right so the most recent days are visible when the
  // grid overflows (typically on phones).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [calendar.length, cell]);

  // Tap-to-reveal detail — the mobile equivalent of the desktop hover tooltip.
  // The bubble is fixed-positioned and clamped to the viewport so it stays
  // visible even for cells near the screen edges.
  const TIP_W = 200;
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(
    null,
  );
  useEffect(() => {
    if (!tip) return;
    const close = () => setTip(null);
    // Defer the outside-tap listener so the opening tap doesn't close it.
    const armed = setTimeout(
      () => document.addEventListener("pointerdown", close, { once: true }),
      0,
    );
    const auto = setTimeout(close, 2600);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      clearTimeout(armed);
      clearTimeout(auto);
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [tip]);

  const showTip = (rect: DOMRect, d: CalendarDay) => {
    const x = Math.max(
      8 + TIP_W / 2,
      Math.min(window.innerWidth - 8 - TIP_W / 2, rect.left + rect.width / 2),
    );
    setTip({ x, y: rect.top - 6, text: labelOf(d) });
  };

  return (
    <>
      <div ref={scrollRef} className="no-scrollbar overflow-x-auto">
        <div className="flex w-max gap-[5px]">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-[5px]">
              {wk.map((d, di) => {
                const trained = d.seance || d.type;
                return (
                  <div
                    key={di}
                    title={labelOf(d)}
                    onClick={(e) =>
                      showTip(e.currentTarget.getBoundingClientRect(), d)
                    }
                    className="shrink-0 cursor-pointer rounded-[3px] border border-line/60"
                    style={{
                      width: cell,
                      height: cell,
                      background: colorOf(d),
                      opacity: trained ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-center font-sans text-[11.5px] font-medium leading-snug text-paper shadow-lg"
          style={{ left: tip.x, top: tip.y, maxWidth: TIP_W }}
        >
          {tip.text}
        </div>
      )}
    </>
  );
}

// Page header used across app pages ────────────────────────────────────────
export function PageHead({
  overline,
  title,
  children,
}: {
  overline?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {overline && <Label className="mb-2">{overline}</Label>}
        <h1 className="font-serif text-[clamp(2rem,5vw,2.9rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// Delta indicator ──────────────────────────────────────────────────────────
export function Delta({
  value,
  suffix = "%",
}: {
  value: number;
  suffix?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-sans text-[12px] font-semibold ${
        up ? "text-accent" : "text-muted"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}
      {suffix}
    </span>
  );
}
