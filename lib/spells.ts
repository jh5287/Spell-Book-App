const API = "https://www.dnd5eapi.co";

export interface SpellSummary {
  index: string;
  name: string;
  level: number;
  url: string;
}

export interface Spell {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  components: string[];
  material?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  desc: string[];
  higher_level?: string[];
  classes: { name: string }[];
}

export async function fetchSpellList(signal?: AbortSignal): Promise<SpellSummary[]> {
  const res = await fetch(`${API}/api/2014/spells`, { signal });
  if (!res.ok) throw new Error("Could not load the spell list");
  const data = await res.json();
  return data.results;
}

export async function fetchSpell(url: string, signal?: AbortSignal): Promise<Spell> {
  const res = await fetch(`${API}${url}`, { signal });
  if (!res.ok) throw new Error("Could not load that spell");
  return res.json();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Returns the single closest spell to the typed text, or null if nothing is close. */
export function findClosestSpell(query: string, spells: SpellSummary[]): SpellSummary | null {
  const q = normalize(query);
  if (!q) return null;

  let best: SpellSummary | null = null;
  let bestScore = Infinity;
  for (const spell of spells) {
    const name = normalize(spell.name);
    let score: number;
    if (name.startsWith(q)) score = name.length - q.length;
    else if (name.split(" ").some((w) => w.startsWith(q))) score = 100 + name.length - q.length;
    else if (name.includes(q)) score = 200 + name.length - q.length;
    else {
      // typo tolerance: compare against the same-length prefix of the name
      const d = distance(q, name.slice(0, q.length));
      if (d > Math.max(1, Math.floor(q.length / 3))) continue;
      score = 300 + d * 10 + name.length;
    }
    if (score < bestScore) {
      bestScore = score;
      best = spell;
    }
  }
  return best;
}

export function levelLabel(spell: Spell): string {
  const school = spell.school.name;
  if (spell.level === 0) return `${school} cantrip`;
  const suffix = ["th", "st", "nd", "rd"][spell.level] ?? "th";
  return `${spell.level}${suffix}-level ${school.toLowerCase()}`;
}
