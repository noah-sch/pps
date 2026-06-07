// ── Push Pull Skip — Mon profil ─────────────────────────────────────────────
// Édite tous les champs du compte + photo de profil (référence de fichier),
// langue et thème. Langue/thème s'appliquent en direct ; le reste est enregistré
// via le bouton. Tout le texte passe par t() (sauf le titre « Push Pull Skip »).
import { useState } from "react";
import {
  Button,
  Divider,
  Field,
  Input,
  Label,
  PageHead,
  Segmented,
} from "./components";
import { Icons } from "./icons";
import { useT, LANGS, type Lang } from "./i18n";
import * as api from "./api";
import type { Nav, PublicUser } from "./types";

export type Theme = "light" | "dark";

// Valeurs canoniques stockées ; les libellés affichés sont traduits via t().
const GENDERS = [
  { v: "homme", l: "Homme" },
  { v: "femme", l: "Femme" },
  { v: "autre", l: "Autre" },
];

export function ProfilePage({
  user,
  nav,
  onSave,
  lang,
  setLang,
  theme,
  setTheme,
}: {
  user: PublicUser;
  nav: Nav;
  onSave: (patch: Partial<PublicUser>) => Promise<void>;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const t = useT();
  const [name, setName] = useState(user.name || "");
  const [gender, setGender] = useState(user.gender || "");
  const [age, setAge] = useState(user.age != null ? String(user.age) : "");
  const [height, setHeight] = useState(
    user.height != null ? String(user.height) : "",
  );
  const [weight, setWeight] = useState(
    user.weight != null ? String(user.weight) : "",
  );
  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);
  const [busy, setBusy] = useState(false);

  // Reset the broken-image flag when the chosen file changes (render-phase).
  const [broken, setBroken] = useState(false);
  const [prevAvatar, setPrevAvatar] = useState(avatar);
  if (prevAvatar !== avatar) {
    setPrevAvatar(avatar);
    setBroken(false);
  }

  const avatarUrl = avatar ? api.fileUrl(avatar) : null;
  const initial = (name.trim() || user.name || "?")[0].toUpperCase();

  const pick = async () => {
    const path = await api.pickImageFile();
    if (path) setAvatar(path);
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        name: name.trim() || user.name,
        gender: gender || null,
        age: age ? +age : null,
        height: height ? +height : null,
        weight: weight ? +weight : null,
        avatar,
        language: lang,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHead overline={t("Ton compte")} title={t("Mon profil")} />

      <div className="flex flex-col gap-7">
        {/* Photo de profil */}
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-ink text-paper">
            {avatarUrl && !broken ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setBroken(true)}
              />
            ) : (
              <span className="font-serif text-[30px] leading-none">
                {initial}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <Button variant="outline" size="sm" onClick={pick}>
              <Icons.Camera size={15} /> {t("Choisir une photo")}
            </Button>
            {avatar && (
              <button
                onClick={() => setAvatar(null)}
                className="font-sans text-[12.5px] text-muted transition hover:text-ink"
              >
                {t("Retirer la photo")}
              </button>
            )}
          </div>
        </div>

        {/* Identité */}
        <Field label={t("Prénom")}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
          />
        </Field>

        <Field label={t("Email")}>
          <Input value={user.email} readOnly disabled className="opacity-60" />
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

        <div className="grid grid-cols-3 gap-4">
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
          <Field label={t("Poids (kg)")}>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
            />
          </Field>
        </div>

        <Divider />

        {/* Préférences — langue & thème (appliquées en direct) */}
        <div>
          <Label className="mb-2 inline-flex items-center gap-1.5">
            <Icons.Globe size={13} /> {t("Langue")}
          </Label>
          <Segmented
            options={LANGS.map((l) => ({ value: l.value, label: l.label }))}
            value={lang}
            onChange={(v) => setLang(v as Lang)}
          />
        </div>

        <div>
          <Label className="mb-2 inline-flex items-center gap-1.5">
            {theme === "dark" ? <Icons.Moon size={13} /> : <Icons.Sun size={13} />}{" "}
            {t("Thème")}
          </Label>
          <Segmented
            options={[
              { value: "light", label: t("Clair") },
              { value: "dark", label: t("Sombre") },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
          />
        </div>

        <Divider />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => nav("tracking")}>
            {t("Annuler")}
          </Button>
          <Button variant="solid" size="base" onClick={save} disabled={busy}>
            <Icons.Check size={17} /> {t("Enregistrer le profil")}
          </Button>
        </div>
      </div>
    </div>
  );
}
