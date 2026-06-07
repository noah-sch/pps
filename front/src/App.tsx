// ── Push Pull Skip — app root: routing, shell, data wiring ──────────────────
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { REF_COLORS, Wordmark } from "./components";
import { Icons } from "./icons";
import { derive, setLocale } from "./derive";
import { I18nProvider, translate, useT, type Lang } from "./i18n";
import { LandingPage, AuthPage, FAQPage } from "./pages_public";
import { HistoryPage, AddSessionPage, TimerPage } from "./pages_app";
import { ReferencesPage } from "./references";
import { ProfilePage, type Theme } from "./profile";
import { Onboarding } from "./onboarding";
import { TrackingPage } from "./tracking";
import * as api from "./api";
import type {
  ExerciseRef,
  Nav,
  NewSession,
  PublicUser,
  RouteName,
  RouteParams,
  SeanceRef,
  Session,
} from "./types";

// NAV labels are stored in French and translated at render time via t().
const NAV: { key: RouteName; label: string; icon: keyof typeof Icons }[] = [
  { key: "tracking", label: "Suivi", icon: "Trend" },
  { key: "history", label: "Historique", icon: "History" },
  { key: "add", label: "Ajouter", icon: "Plus" },
  { key: "references", label: "Références", icon: "Bookmark" },
  { key: "timer", label: "Chrono", icon: "Timer" },
];

// ── Préférences appareil (langue + thème), mémorisées dans le localStorage ──
const LANG_KEY = "pps.lang";
const THEME_KEY = "pps.theme";

function loadLang(): Lang {
  const v = (() => {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null;
    }
  })();
  return v === "en" ? "en" : "fr";
}

function loadTheme(): Theme {
  const v = (() => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  })();
  return v === "dark" ? "dark" : "light";
}

/** Debounced persistence that skips the initial value loaded at bootstrap. */
function useDebouncedPersist<T>(
  value: T,
  ready: boolean,
  save: (v: T) => void,
) {
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => void save(value), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);
}

export default function App() {
  const [route, setRoute] = useState<{ name: RouteName; params: RouteParams }>({
    name: "landing",
    params: {},
  });
  const [user, setUser] = useState<PublicUser | null>(null);
  // Account just created, in the onboarding flow (not yet "logged in").
  const [pendingUser, setPendingUser] = useState<PublicUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [seanceRefs, setSeanceRefs] = useState<SeanceRef[]>([]);
  const [exerciseRefs, setExerciseRefs] = useState<ExerciseRef[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [lang, setLang] = useState<Lang>(loadLang);
  const [theme, setTheme] = useState<Theme>(loadTheme);

  // Keep the date-formatting locale in sync with the chosen language (synchronously,
  // before `derived` is recomputed below).
  setLocale(lang);

  // Apply the theme to <html> (drives the .dark CSS variables) and persist it.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* stockage indisponible */
    }
  }, [theme]);

  // Persist the language preference.
  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* stockage indisponible */
    }
  }, [lang]);

  // Load everything from the Rust backend once.
  useEffect(() => {
    api
      .bootstrap()
      .then((b) => {
        setSessions(b.sessions);
        setSeanceRefs(b.seanceRefs);
        setExerciseRefs(b.exerciseRefs);
        setAppVersion(b.appVersion);
        if (b.user?.language === "en" || b.user?.language === "fr") {
          setLang(b.user.language);
        }
        setReady(true);
      })
      .catch((e) => {
        console.error("bootstrap failed", e);
        setReady(true);
      });
  }, []);

  // Persist reference edits (debounced). The backend propagates any rename to
  // the recorded sessions and returns the refreshed list, so update the history.
  useDebouncedPersist(seanceRefs, ready, async (refs: SeanceRef[]) => {
    setSessions(await api.saveSeanceRefs(refs));
  });
  useDebouncedPersist(exerciseRefs, ready, async (refs: ExerciseRef[]) => {
    setSessions(await api.saveExerciseRefs(refs));
  });

  // `lang` is a dependency on purpose: derive() reads the locale set by
  // setLocale(lang) above (week-label prefix), so it must recompute on change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const derived = useMemo(() => derive(sessions), [sessions, lang]);

  const addSeanceRef = (name: string): SeanceRef => {
    const existing = seanceRefs.find(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const used = seanceRefs.map((r) => r.color);
    const color =
      REF_COLORS.find((c) => !used.includes(c)) ||
      REF_COLORS[seanceRefs.length % REF_COLORS.length];
    const ref: SeanceRef = { id: "u_" + Date.now().toString(36), name, color };
    setSeanceRefs((p) => [...p, ref]);
    return ref;
  };
  const addExerciseRef = (name: string, muscle: string): ExerciseRef => {
    const existing = exerciseRefs.find(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const ref: ExerciseRef = {
      id: "u_" + Date.now().toString(36),
      name,
      muscle: muscle || "",
      comment: "",
    };
    setExerciseRefs((p) => [...p, ref]);
    return ref;
  };

  const nav: Nav = (name, params = {}) => {
    setRoute({ name, params });
    window.scrollTo({ top: 0 });
  };

  const onAuth = (u: PublicUser) => {
    setUser(u);
    if (u.language === "en" || u.language === "fr") setLang(u.language);
    nav("tracking");
  };
  const logout = () => {
    setUser(null);
    nav("landing");
  };

  // ── Onboarding (après inscription) ──
  // Le compte est créé en base ; on diffère le « login » (setUser) jusqu'à la
  // fin ou au skip du questionnaire.
  const onSignup = (u: PublicUser) => setPendingUser(u);

  const saveOnboardingProfile = async (patch: Partial<PublicUser>) => {
    if (!pendingUser) return;
    try {
      // On fusionne avec le compte existant pour ne pas écraser les autres champs.
      const updated = await api.updateProfile({ ...pendingUser, ...patch });
      setPendingUser(updated);
    } catch (e) {
      console.error("onboarding profile save failed", e);
    }
  };

  const finishOnboarding = () => {
    if (pendingUser) onAuth(pendingUser);
    setPendingUser(null);
  };

  const flash = (fr: string, ms = 2600, vars?: Record<string, string>) => {
    setToast(translate(lang, fr, vars));
    setTimeout(() => setToast(null), ms);
  };

  const saveSession = async (s: NewSession) => {
    try {
      const updated = await api.addSession(s);
      setSessions(updated);
      nav("history");
      flash("Séance enregistrée ✓");
    } catch (e) {
      flash("Erreur : {e}", 3200, { e: String(e) });
    }
  };

  const updateSession = async (id: string, s: NewSession) => {
    try {
      const updated = await api.updateSession(id, s);
      setSessions(updated);
      nav("history");
      flash("Séance mise à jour ✓");
    } catch (e) {
      flash("Erreur : {e}", 3200, { e: String(e) });
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const updated = await api.deleteSession(id);
      setSessions(updated);
      flash("Séance supprimée ✓");
    } catch (e) {
      flash("Erreur : {e}", 3200, { e: String(e) });
    }
  };

  const saveProfile = async (patch: Partial<PublicUser>) => {
    try {
      const updated = await api.updateProfile(patch);
      setUser(updated);
      flash("Profil enregistré ✓");
    } catch (e) {
      flash("Erreur : {e}", 3200, { e: String(e) });
    }
  };

  const avatarUrl = user?.avatar ? api.fileUrl(user.avatar) : null;

  let screen: ReactNode;
  if (!ready) {
    screen = (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="animate-pulse">
          <Wordmark size="lg" />
        </div>
      </div>
    );
  } else if (pendingUser) {
    // ── onboarding (compte créé, pas encore connecté) ──
    screen = (
      <Onboarding
        user={pendingUser}
        onSaveProfile={saveOnboardingProfile}
        onFinish={finishOnboarding}
        seanceRefs={seanceRefs}
        setSeanceRefs={setSeanceRefs}
        exerciseRefs={exerciseRefs}
        setExerciseRefs={setExerciseRefs}
      />
    );
  } else if (!user) {
    // ── public routes ──
    if (route.name === "auth")
      screen = (
        <AuthPage
          nav={nav}
          mode={route.params.mode}
          onAuth={onAuth}
          onSignup={onSignup}
        />
      );
    else if (route.name === "faq") screen = <FAQPage nav={nav} />;
    else
      screen = (
        <LandingPage
          nav={nav}
          derived={derived}
          sessions={sessions}
          seanceRefs={seanceRefs}
          lang={lang}
          setLang={setLang}
        />
      );
  } else {
    // ── app routes ──
    const editing = route.params.editId
      ? sessions.find((s) => s.id === route.params.editId) ?? null
      : null;
    let content;
    if (route.name === "add")
      content = (
        <AddSessionPage
          key={route.params.editId || "new"}
          nav={nav}
          onSave={saveSession}
          onUpdate={updateSession}
          editSession={editing}
          seanceRefs={seanceRefs}
          exerciseRefs={exerciseRefs}
          addSeanceRef={addSeanceRef}
          addExerciseRef={addExerciseRef}
        />
      );
    else if (route.name === "references")
      content = (
        <ReferencesPage
          seanceRefs={seanceRefs}
          setSeanceRefs={setSeanceRefs}
          exerciseRefs={exerciseRefs}
          setExerciseRefs={setExerciseRefs}
        />
      );
    else if (route.name === "timer") content = <TimerPage />;
    else if (route.name === "profile")
      content = (
        <ProfilePage
          user={user}
          nav={nav}
          onSave={saveProfile}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
        />
      );
    else if (route.name === "tracking")
      content = (
        <TrackingPage
          user={user}
          derived={derived}
          sessions={sessions}
          seanceRefs={seanceRefs}
          exerciseRefs={exerciseRefs}
        />
      );
    else
      content = (
        <HistoryPage
          sessions={sessions}
          nav={nav}
          seanceRefs={seanceRefs}
          onDelete={deleteSession}
        />
      );

    screen = (
      <div className="min-h-screen bg-cream pb-24 sm:pb-0">
        <TopBar
          route={route}
          nav={nav}
          user={user}
          logout={logout}
          version={appVersion}
          avatarUrl={avatarUrl}
        />
        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
          {content}
        </main>
        <BottomNav route={route} nav={nav} />
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 sm:bottom-8">
            <div className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-sans text-[14px] font-medium text-paper shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <I18nProvider lang={lang}>{screen}</I18nProvider>;
}

// ── Top bar (desktop nav) ──
function TopBar({
  route,
  nav,
  user,
  logout,
  version,
  avatarUrl,
}: {
  route: { name: RouteName };
  nav: Nav;
  user: PublicUser;
  logout: () => void;
  version: string;
  avatarUrl: string | null;
}) {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <button
          onClick={() => nav("tracking")}
          className="shrink-0"
          title={version ? `Push Pull Skip v${version}` : "Push Pull Skip"}
        >
          <Wordmark size="sm" />
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = route.name === item.key;
            const I = Icons[item.icon];
            return (
              <button
                key={item.key}
                onClick={() => nav(item.key)}
                className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans text-[14px] font-medium transition ${
                  active ? "text-ink" : "text-ink/50 hover:text-ink"
                }`}
              >
                <I size={16} className={active ? "text-accent" : ""} />
                {t(item.label)}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[17px] h-[2px] rounded-full bg-ink" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Icône profil → onglet « Mon profil » (avatar si défini, sinon initiale) */}
          <button
            onClick={() => nav("profile")}
            title={t("Mon profil")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border transition ${
              route.name === "profile"
                ? "border-accent ring-2 ring-accent/30"
                : "border-line hover:border-ink/40"
            }`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-ink font-sans text-[13px] font-semibold text-paper">
                {user.name[0]}
              </span>
            )}
          </button>
          <button
            onClick={logout}
            title={t("Se déconnecter")}
            className="rounded-full p-2 text-ink/50 transition hover:bg-ink/5 hover:text-ink"
          >
            <Icons.Logout size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Bottom nav (mobile) ──
function BottomNav({
  route,
  nav,
}: {
  route: { name: RouteName };
  nav: Nav;
}) {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {NAV.map((item) => {
          const active = route.name === item.key;
          const I = Icons[item.icon];
          return (
            <button
              key={item.key}
              onClick={() => nav(item.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                  active ? "text-accent" : ""
                }`}
                style={active ? { background: "var(--accent-soft)" } : undefined}
              >
                <I size={20} />
              </span>
              <span className="font-sans text-[10.5px] font-medium tracking-wide">
                {t(item.label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
