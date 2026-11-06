import { createLocalStore } from "./localStore";
import { ordinal, type Spell } from "./spells";

export type BookView = "full" | "compact" | "list";

export const BOOK_VIEWS: { value: BookView; label: string }[] = [
  { value: "full", label: "Full" },
  { value: "compact", label: "Compact" },
  { value: "list", label: "List" },
];

function isSpell(v: unknown): v is Spell {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Partial<Spell>;
  return (
    typeof s.index === "string" &&
    typeof s.name === "string" &&
    typeof s.level === "number" &&
    typeof s.school?.name === "string" &&
    typeof s.description === "string" &&
    Array.isArray(s.components) &&
    Array.isArray(s.classes)
  );
}

/** Saved spells, in the user's order (new spells go to the end of their level). */
export const spellBook = createLocalStore<Spell[]>(
  "spellbook:spells",
  [],
  (v): v is Spell[] => Array.isArray(v) && v.every(isSpell),
);

export const bookView = createLocalStore<BookView>(
  "spellbook:view",
  "full",
  (v): v is BookView => BOOK_VIEWS.some((o) => o.value === v),
);

export function addToBook(spells: Spell[], spell: Spell): Spell[] {
  return spells.some((s) => s.index === spell.index) ? spells : [...spells, spell];
}

export function removeFromBook(spells: Spell[], index: string): Spell[] {
  return spells.filter((s) => s.index !== index);
}

/** Moves `activeId` to where `overId` is, shuffling only the spells of that level. */
export function reorderWithinLevel(
  spells: Spell[],
  level: number,
  activeId: string,
  overId: string,
): Spell[] {
  const slots = spells.flatMap((s, i) => (s.level === level ? [i] : []));
  const group = slots.map((i) => spells[i]);
  const from = group.findIndex((s) => s.index === activeId);
  const to = group.findIndex((s) => s.index === overId);
  if (from < 0 || to < 0 || from === to) return spells;

  const moved = [...group];
  moved.splice(to, 0, ...moved.splice(from, 1));
  const next = [...spells];
  slots.forEach((slot, k) => {
    next[slot] = moved[k];
  });
  return next;
}

export interface LevelGroup {
  level: number;
  spells: Spell[];
}

/** Cantrips first, then level 1, 2, … keeping each spell's saved order within its level. */
export function groupByLevel(spells: Spell[]): LevelGroup[] {
  const groups = new Map<number, Spell[]>();
  for (const spell of spells) {
    groups.set(spell.level, [...(groups.get(spell.level) ?? []), spell]);
  }
  return [...groups]
    .sort(([a], [b]) => a - b)
    .map(([level, list]) => ({ level, spells: list }));
}

export function levelHeading(level: number): string {
  return level === 0 ? "Cantrips" : `${ordinal(level)} Level`;
}
