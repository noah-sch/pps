// ── Push Pull Skip — public pages (logged out) ──────────────────────────────
import { useState } from "react";
import {
  ActivityGrid,
  Button,
  Field,
  Input,
  Label,
  Segmented,
  Sparkline,
  Wordmark,
} from "./components";
import { Icons } from "./icons";
import { useT, type Lang } from "./i18n";
import { fmtDate, fmtVol } from "./derive";
import type { Derived, Nav, PublicUser, SeanceRef, Session } from "./types";
import * as api from "./api";

// ── « Rester connecté » ──────────────────────────────────────────────────────
// Les identifiants de la dernière connexion réussie sont mémorisés localement
// (localStorage, persisté par le webview Tauri entre deux lancements) afin de
// pré-remplir le formulaire de connexion au retour dans l'app.
const CREDS_KEY = "pps.lastCredentials";
type SavedCreds = { name: string; email: string; password: string };

function loadCreds(): SavedCreds {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<SavedCreds>;
      return {
        name: v.name ?? "",
        email: v.email ?? "",
        password: v.password ?? "",
      };
    }
  } catch {
    // stockage indisponible ou corrompu — on repart d'un formulaire vide.
  }
  return { name: "", email: "", password: "" };
}

function saveCreds(c: SavedCreds) {
  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(c));
  } catch {
    // stockage indisponible — la mémorisation est simplement ignorée.
  }
}

// ── « Compte déjà existant » ─────────────────────────────────────────────────
// Mémorise qu'un compte a déjà été créé / utilisé sur cet appareil. Dès lors on
// ne propose plus la création de compte (onglet, tuile, CTA) : il ne reste qu'à
// se connecter. Le drapeau est posé à l'inscription ; une connexion réussie
// (qui mémorise un email via saveCreds) compte aussi comme « compte existant ».
const ACCOUNT_KEY = "pps.hasAccount";

function hasAccount(): boolean {
  try {
    if (localStorage.getItem(ACCOUNT_KEY) === "1") return true;
    return !!loadCreds().email; // connexion réussie antérieure
  } catch {
    return false;
  }
}

function markAccountCreated() {
  try {
    localStorage.setItem(ACCOUNT_KEY, "1");
  } catch {
    // stockage indisponible — le masquage de l'inscription est simplement ignoré.
  }
}

// Aperçu produit (mini dashboard réel) — reflète les données de la dernière
// personne connectée (sessions + références de couleurs stockées localement).
function HeroPreview({
  derived,
  sessions,
  seanceRefs,
}: {
  derived: Derived;
  sessions: Session[];
  seanceRefs: SeanceRef[];
}) {
  const t = useT();
  const { stats, weeks, calendar } = derived;
  const colors: Record<string, string> = {};
  seanceRefs.forEach((r) => {
    colors[r.name] = r.color;
  });
  const recent = sessions.slice(0, 3);
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -right-3 -top-3 hidden h-full w-full rounded-card border border-line bg-paper/50 sm:block" />
      <div className="relative overflow-hidden rounded-card border border-line bg-paper shadow-[0_36px_90px_-40px_rgba(28,26,22,0.45)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <Wordmark size="sm" />
          <span className="font-sans text-[10.5px] uppercase tracking-[0.18em] text-muted">
            {t("Suivi")}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-sans text-[10.5px] uppercase tracking-[0.18em] text-muted">
                {t("Volume · 7 jours")}
              </div>
              <div className="mt-1.5 whitespace-nowrap font-serif text-[34px] leading-none text-ink">
                {fmtVol(stats.thisWeekVol)}{" "}
                <span className="text-[18px] text-muted">kg</span>
              </div>
            </div>
            <Sparkline
              data={weeks.map((w) => w.volume)}
              color="var(--accent)"
              width={96}
              height={42}
            />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sans text-[10.5px] uppercase tracking-[0.18em] text-muted">
                {t("Régularité")}
              </span>
              <span className="whitespace-nowrap font-mono text-[11px] text-ink/60">
                {stats.streakWeeks} {t("sem.")}
              </span>
            </div>
            <ActivityGrid calendar={calendar.slice(-49)} cell={12} colors={colors} />
          </div>

          <div className="mt-5 border-t border-line pt-2">
            {recent.length === 0 ? (
              <div className="py-3 text-center font-sans text-[12.5px] text-muted">
                {t("Aucune séance enregistrée.")}
              </div>
            ) : (
              recent.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-3 py-2 ${
                    i > 0 ? "border-t border-line/60" : ""
                  }`}
                >
                  <span className="shrink-0 font-mono text-[12px] text-muted">
                    {fmtDate(s.date)}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: colors[s.name] || "var(--muted)" }}
                    />
                    <span className="truncate font-sans text-[13px] text-ink/80">
                      {s.name}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Accueil — concept « fiche technique » ────────────────────────────────────
const SPEC_ROWS = [
  { w: "Push", label: "", anim: "a-l", accent: false, d: 0.15 },
  { w: "Pull", label: "", anim: "a-r", accent: false, d: 0.3 },
  { w: "Skip", label: "", anim: "a-skip", accent: true, d: 0.45 },
];

function CornerMarks() {
  const base = "pointer-events-none absolute h-3 w-3 border-muted/40";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

export function LandingPage({
  nav,
  derived,
  sessions,
  seanceRefs,
  lang,
  setLang,
}: {
  nav: Nav;
  derived: Derived;
  sessions: Session[];
  seanceRefs: SeanceRef[];
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const t = useT();
  // Compte déjà créé / utilisé sur cet appareil : on masque la tuile d'inscription.
  const accountExists = hasAccount();
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Wordmark />
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            title={t("Langue")}
            aria-label={t("Langue")}
          >
            <Icons.Globe size={15} />
            {lang === "fr" ? "FR" : "EN"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => nav("faq")}>
            {t("FAQ")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("auth", { mode: "login" })}
          >
            {t("Se connecter")}
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-10 lg:justify-center">
        {/* meta strip */}
        <div className="flex items-center justify-between whitespace-nowrap border-b border-line py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted a-up">
          <span>{t("Système d'entraînement")}</span>
          <span className="hidden sm:block">{t("Enregistrement / Suivi / Analyse")}</span>
          <span>№ 001 — v0.1.0</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
          {/* left — conceptual spec table */}
          <div className="lg:col-span-8">
            <div className="relative px-1 py-2">
              <CornerMarks />
              {SPEC_ROWS.map((r, i) => (
                <div
                  key={r.w}
                  className="grid grid-cols-[1.6rem_1fr_auto] items-baseline gap-3 border-b border-line py-2 sm:grid-cols-[2.2rem_1fr_auto] sm:gap-6 sm:py-3"
                  style={{ borderTop: i === 0 ? "1px solid var(--line)" : undefined }}
                >
                  <span
                    className="a-up font-mono text-[11px] text-muted"
                    style={{ animationDelay: `${r.d + 0.1}s` }}
                  >
                    0{i + 1}
                  </span>
                  <h2
                    className={`${r.anim} font-serif text-[clamp(3.2rem,11vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.035em] ${
                      r.accent ? "text-accent" : "text-ink"
                    }`}
                    style={{ animationDelay: `${r.d}s` }}
                  >
                    {r.w}
                  </h2>
                  <span
                    className="a-up hidden whitespace-nowrap pb-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted sm:block"
                    style={{ animationDelay: `${r.d + 0.15}s` }}
                  >
                    {t(r.label)}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs — tuiles d'accès */}
            <div
              className="mt-12 grid max-w-xl grid-cols-1 gap-3 a-up sm:grid-cols-2"
              style={{ animationDelay: "0.6s" }}
            >
              {!accountExists && (
                <button
                  onClick={() => nav("auth", { mode: "signup" })}
                  className="group flex w-full items-center justify-between gap-4 rounded-xl border border-ink/20 px-5 py-4 text-left transition-colors duration-200 hover:border-ink/50"
                >
                  <span className="flex flex-col">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-muted">
                      {t("Nouveau")}
                    </span>
                    <span className="mt-1 whitespace-nowrap font-sans text-[15px] font-medium text-ink">
                      {t("Créer un compte")}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-200 group-hover:translate-x-0.5">
                    <Icons.Arrow size={15} />
                  </span>
                </button>
              )}

              <button
                onClick={() => nav("auth", { mode: "login" })}
                className="group flex w-full items-center justify-between gap-4 rounded-xl border border-ink/15 px-5 py-4 text-left transition-colors duration-200 hover:border-ink/40"
              >
                <span className="flex flex-col">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-muted">
                    {t("Déjà membre")}
                  </span>
                  <span className="mt-1 whitespace-nowrap font-sans text-[15px] font-medium text-ink/80">
                    {t("Se connecter")}
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink/55 transition-transform duration-200 group-hover:translate-x-0.5">
                  <Icons.Arrow size={15} />
                </span>
              </button>
            </div>
          </div>

          {/* right — live readout */}
          <div
            className="flex items-center lg:col-span-4 a-up"
            style={{ animationDelay: "0.5s" }}
          >
            <HeroPreview
              derived={derived}
              sessions={sessions}
              seanceRefs={seanceRefs}
            />
          </div>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between whitespace-nowrap border-t border-line px-6 py-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted sm:px-10">
        <span>© 2026 Push Pull Skip</span>
        <span className="hidden sm:block">{t("Carnet d'entraînement")}</span>
      </footer>
    </div>
  );
}

// Connexion / Inscription ──────────────────────────────────────────────────
export function AuthPage({
  nav,
  mode: initialMode,
  onAuth,
  onSignup,
}: {
  nav: Nav;
  mode?: "login" | "signup";
  onAuth: (user: PublicUser) => void;
  // À l'inscription : déclenche l'onboarding plutôt que d'entrer directement.
  onSignup: (user: PublicUser) => void;
}) {
  const t = useT();
  // Compte déjà créé / utilisé sur cet appareil : on ne propose que la connexion.
  const accountExists = hasAccount();
  const [mode, setMode] = useState<"login" | "signup">(
    accountExists ? "login" : initialMode || "login",
  );
  // Pré-rempli depuis la dernière connexion mémorisée (« rester connecté »).
  const [form, setForm] = useState<SavedCreds>(loadCreds);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Mémorise les identifiants pour pré-remplir la prochaine connexion.
      if (mode === "signup") {
        const user = await api.signup(form.name, form.email, form.password);
        saveCreds(form);
        markAccountCreated();
        onSignup(user);
      } else {
        const user = await api.login(form.email, form.password);
        saveCreds(form);
        onAuth(user);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <button onClick={() => nav("landing")}>
          <Wordmark />
        </button>
        <Button variant="ghost" size="sm" onClick={() => nav("faq")}>
          {t("FAQ")}
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif text-[clamp(2rem,6vw,2.8rem)] font-medium leading-tight tracking-[-0.02em] text-ink">
            {mode === "login" ? t("Bon retour.") : t("On commence ?")}
          </h1>
          <p className="mt-2 font-sans text-[14px] text-ink/55">
            {mode === "login"
              ? t("Reprends là où tu t'es arrêté.")
              : t("Crée ton carnet en quelques secondes.")}
          </p>

          {!accountExists && (
            <div className="mt-7 mb-6">
              <Segmented
                options={[
                  { value: "login", label: t("Connexion") },
                  { value: "signup", label: t("Inscription") },
                ]}
                value={mode}
                onChange={(v) => {
                  setMode(v as "login" | "signup");
                  setError(null);
                }}
              />
            </div>
          )}

          <form
            onSubmit={submit}
            className={`flex flex-col gap-5 ${accountExists ? "mt-8" : ""}`}
          >
            {mode === "signup" && (
              <Field label={t("Prénom")}>
                <Input value={form.name} onChange={set("name")} placeholder={t("Alex")} />
              </Field>
            )}
            <Field label={t("Email")}>
              <Input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder={t("alex@exemple.fr")}
                required
              />
            </Field>
            <Field
              label={t("Mot de passe")}
              hint={mode === "login" ? t("Oublié ?") : t("8 caractères min.")}
            >
              <Input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                required
              />
            </Field>
            {error && (
              <p
                className="font-sans text-[13px] font-medium"
                style={{ color: "oklch(0.55 0.16 25)" }}
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="solid"
              size="lg"
              className="mt-1 w-full"
              disabled={busy}
            >
              {mode === "login" ? t("Se connecter") : t("Créer mon compte")}{" "}
              <Icons.Arrow size={17} />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

// FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "C'est quoi Push Pull Skip ?",
    a: "Un carnet d'entraînement structuré pour tes séances à la salle. Tu enregistres chaque séance par type en spécifiant les exercices que tu as réalisés, et l'application suit ta progression dans le temps.",
  },
  {
    q: "Comment je suis mes performances ?",
    a: "Chaque séance enregistre tes exercices, séries, reps et charges. L'app calcule automatiquement ton volume, tes records personnels (PR), ta régularité et l'évolution de tes charges semaine après semaine.",
  },
  {
    q: "Le chronomètre sert à quoi ?",
    a: "À gérer tes temps de repos entre les séries et à chronométrer ta séance. Tu peux lancer, mettre en pause et marquer des tours pour comparer tes séries.",
  },
  {
    q: "Puis-je personnaliser mes séances ?",
    a: "Oui. PPS couvre tous les types de séances : tu nommes librement chaque séance et tu ajoutes les exercices de ton choix, avec leurs séries et leurs charges.",
  },
  {
    q: "Mes données sont-elles enregistrées ?",
    a: "Oui. Tes séances, références et ton compte sont stockés localement sur ton appareil, dans une base de données JSON gérée par l'application.",
  },
];

export function FAQPage({ nav }: { nav: Nav }) {
  const t = useT();
  const [open, setOpen] = useState(0);
  const accountExists = hasAccount();
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <button onClick={() => nav("landing")}>
          <Wordmark />
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => nav("auth", { mode: "login" })}
        >
          {t("Se connecter")}
        </Button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-16">
        <Label>{t("Aide")}</Label>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
          {t("Questions fréquentes")}
        </h1>

        <div className="mt-10 border-t border-line">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-line">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-serif text-[19px] leading-snug text-ink">
                    {t(item.q)}
                  </span>
                  <span
                    className={`shrink-0 text-ink transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Icons.Plus size={20} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-8 font-sans text-[15px] leading-relaxed text-ink/65">
                      {t(item.a)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-card border border-line bg-paper px-8 py-9 text-center">
          <p className="font-serif text-[22px] text-ink">
            {t("Enregistre tes séances.")}
          </p>
          <Button
            variant="solid"
            size="lg"
            onClick={() =>
              nav("auth", { mode: accountExists ? "login" : "signup" })
            }
          >
            {accountExists ? t("Se connecter") : t("Créer un compte")}{" "}
            <Icons.Arrow size={17} />
          </Button>
        </div>
      </main>
    </div>
  );
}
