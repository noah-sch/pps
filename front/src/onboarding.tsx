// ── Push Pull Skip — onboarding (post-inscription, optionnel) ───────────────
// Affiché juste après la création du compte. Deux étapes : (1) profil
// (âge/taille/poids/genre), (2) premières références (séances + exercices,
// réutilise la page Références). Chaque étape est passable ; à la fin ou au
// skip, `onFinish` connecte l'utilisateur. Le titre « Push Pull Skip » (Wordmark)
// reste inchangé ; tout le reste passe par t().
import { useState } from "react";
import {
  Button,
  Divider,
  Field,
  Input,
  Label,
  Segmented,
  Wordmark,
} from "./components";
import { Icons } from "./icons";
import { useT } from "./i18n";
import { ReferencesPage } from "./references";
import type { ExerciseRef, PublicUser, SeanceRef } from "./types";

const GENDERS = [
  { v: "homme", l: "Homme" },
  { v: "femme", l: "Femme" },
  { v: "autre", l: "Autre" },
];

function StepDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-1.5 w-8 rounded-full transition ${
        active ? "bg-ink" : "bg-line"
      }`}
    />
  );
}

export function Onboarding({
  user,
  onSaveProfile,
  onFinish,
  seanceRefs,
  setSeanceRefs,
  exerciseRefs,
  setExerciseRefs,
}: {
  user: PublicUser;
  onSaveProfile: (patch: Partial<PublicUser>) => Promise<void>;
  onFinish: () => void;
  seanceRefs: SeanceRef[];
  setSeanceRefs: React.Dispatch<React.SetStateAction<SeanceRef[]>>;
  exerciseRefs: ExerciseRef[];
  setExerciseRefs: React.Dispatch<React.SetStateAction<ExerciseRef[]>>;
}) {
  const t = useT();
  const [step, setStep] = useState(0); // 0 = profil, 1 = références
  const [age, setAge] = useState(user.age != null ? String(user.age) : "");
  const [gender, setGender] = useState(user.gender || "");
  const [height, setHeight] = useState(
    user.height != null ? String(user.height) : "",
  );
  const [weight, setWeight] = useState(
    user.weight != null ? String(user.weight) : "",
  );
  const [busy, setBusy] = useState(false);

  const saveProfileStep = async () => {
    setBusy(true);
    await onSaveProfile({
      age: age ? +age : null,
      gender: gender || null,
      height: height ? +height : null,
      weight: weight ? +weight : null,
    });
    setBusy(false);
    setStep(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark />
        <button
          onClick={onFinish}
          className="font-sans text-[13px] font-medium text-muted transition hover:text-ink"
        >
          {t("Passer pour l'instant")}
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6 sm:py-10">
        <div className="mb-7 flex items-center gap-2">
          <StepDot active={step >= 0} />
          <StepDot active={step >= 1} />
          <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {t("Étape {n}/2", { n: step + 1 })}
          </span>
        </div>

        {step === 0 ? (
          <div>
            <h1 className="font-serif text-[clamp(1.8rem,5vw,2.6rem)] font-medium leading-tight tracking-[-0.02em] text-ink">
              {t("Bienvenue {name} !", { name: user.name })}
            </h1>
            <p className="mt-2 mb-7 font-sans text-[14px] text-ink/55">
              {t(
                "Quelques infos pour personnaliser ton suivi — facultatif, tu pourras les modifier plus tard.",
              )}
            </p>

            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("Âge")}>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                  />
                </Field>
                <Field label={t("Taille (cm)")}>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                  />
                </Field>
              </div>
              <Field label={t("Poids (kg)")}>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                />
              </Field>
              <div>
                <Label className="mb-2">{t("Genre")}</Label>
                <Segmented
                  options={[
                    { value: "", label: t("Non précisé") },
                    ...GENDERS.map((g) => ({ value: g.v, label: t(g.l) })),
                  ]}
                  value={gender}
                  onChange={setGender}
                />
              </div>
            </div>

            <Divider className="my-7" />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setStep(1)}>
                {t("Passer")}
              </Button>
              <Button
                variant="solid"
                size="base"
                onClick={saveProfileStep}
                disabled={busy}
              >
                {t("Continuer")} <Icons.Arrow size={17} />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <ReferencesPage
              seanceRefs={seanceRefs}
              setSeanceRefs={setSeanceRefs}
              exerciseRefs={exerciseRefs}
              setExerciseRefs={setExerciseRefs}
            />
            <Divider className="my-7" />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={onFinish}>
                {t("Passer")}
              </Button>
              <Button variant="solid" size="base" onClick={onFinish}>
                <Icons.Check size={17} /> {t("Terminer")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
