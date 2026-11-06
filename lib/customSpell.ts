import type { Spell } from "./spells";

/** Raw form values; everything is a string/boolean so inputs stay controlled. */
export interface Draft {
  name: string;
  kind: string;
  level: string; // "" until chosen, then "0"–"9"
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialText: string;
  classes: string;
  description: string;
  higherLevel: string;
}

export const EMPTY_DRAFT: Draft = {
  name: "",
  kind: "Spell",
  level: "",
  school: "",
  castingTime: "",
  range: "",
  duration: "",
  concentration: false,
  ritual: false,
  verbal: false,
  somatic: false,
  material: false,
  materialText: "",
  classes: "",
  description: "",
  higherLevel: "",
};

export const LIMITS = {
  name: 80,
  kind: 30,
  short: 80, // school, casting time, range, duration, classes
  material: 200,
  description: 5000,
  higherLevel: 1000,
};

export type Errors = Partial<Record<"name" | "kind" | "level" | "description", string>>;

/** Fields in on-screen order, so the first error can be focused. */
export const ERROR_ORDER: (keyof Errors)[] = ["name", "kind", "level", "description"];

/** Anything typed as "spell" is a real spell (needs a level); any other type is a free-form entry. */
export function isSpellKind(kind: string): boolean {
  return kind.trim().toLowerCase() === "spell";
}

function normalizedKind(kind: string): string {
  return isSpellKind(kind) ? "" : kind.trim().toLowerCase();
}

/** `ignoreIndex` skips the entry being edited so it doesn't count as its own duplicate. */
export function validateDraft(draft: Draft, existing: Spell[], ignoreIndex?: string): Errors {
  const errors: Errors = {};
  const name = draft.name.trim();
  const kind = draft.kind.trim();

  if (!name) errors.name = "Name is missing. Give your entry a name.";
  else if (name.length > LIMITS.name) errors.name = `Name is too long (max ${LIMITS.name} characters).`;
  else if (
    existing.some(
      (s) =>
        s.index !== ignoreIndex &&
        s.name.trim().toLowerCase() === name.toLowerCase() &&
        (s.kind ?? "").toLowerCase() === normalizedKind(kind),
    )
  ) {
    errors.name = `You already have “${name}” in your book. Rename it or remove the old one first.`;
  }

  if (!kind) errors.kind = "Type is missing. Pick one from the list or type your own, like Ability or Item.";
  else if (kind.length > LIMITS.kind) errors.kind = `Type is too long (max ${LIMITS.kind} characters).`;

  if (isSpellKind(kind)) {
    const level = Number(draft.level);
    if (draft.level === "") errors.level = "Spell level is missing. Choose Cantrip or 1st–9th level.";
    else if (!Number.isInteger(level) || level < 0 || level > 9) {
      errors.level = "Spell level can only be cantrip or 1–9.";
    }
  }

  const description = draft.description.trim();
  if (!description) errors.description = "Description is missing. Say what it does.";
  else if (description.length > LIMITS.description) {
    errors.description = `Description is too long (max ${LIMITS.description} characters).`;
  }

  return errors;
}

function newIndex(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Turns a validated draft into a book entry. Spell-only fields are dropped for other types. */
export function draftToSpell(draft: Draft, index: string = newIndex()): Spell {
  const kind = draft.kind.trim();
  const isSpell = isSpellKind(kind);
  const short = (s: string) => s.trim().slice(0, LIMITS.short);
  const material = isSpell && draft.material ? draft.materialText.trim().slice(0, LIMITS.material) : "";

  return {
    index,
    name: draft.name.trim().slice(0, LIMITS.name),
    level: isSpell ? Number(draft.level) : 0,
    ...(isSpell ? {} : { kind: capitalize(kind.slice(0, LIMITS.kind)) }),
    custom: true,
    school: { name: isSpell ? short(draft.school) : "" },
    casting_time: short(draft.castingTime),
    range: short(draft.range),
    components: isSpell
      ? [draft.verbal && "V", draft.somatic && "S", draft.material && "M"].filter((c): c is string => !!c)
      : [],
    ...(material ? { material } : {}),
    duration: short(draft.duration),
    concentration: draft.concentration,
    ritual: isSpell && draft.ritual,
    description: draft.description.trim().slice(0, LIMITS.description),
    ...(isSpell && draft.higherLevel.trim()
      ? { higher_level: draft.higherLevel.trim().slice(0, LIMITS.higherLevel) }
      : {}),
    classes: draft.classes
      .split(",")
      .map((c) => c.trim().slice(0, LIMITS.short))
      .filter(Boolean)
      .map((name) => ({ name })),
  };
}

/** The reverse of `draftToSpell`, used to prefill the form when editing. */
export function spellToDraft(spell: Spell): Draft {
  return {
    name: spell.name,
    kind: spell.kind ?? "Spell",
    level: spell.kind ? "" : String(spell.level),
    school: spell.school.name,
    castingTime: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    verbal: spell.components.includes("V"),
    somatic: spell.components.includes("S"),
    material: spell.components.includes("M"),
    materialText: spell.material ?? "",
    classes: spell.classes.map((c) => c.name).join(", "),
    description: spell.description,
    higherLevel: spell.higher_level ?? "",
  };
}
