"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchSpell,
  fetchSpellList,
  findClosestSpell,
  levelLabel,
  type Spell,
  type SpellSummary,
} from "@/lib/spells";
import styles from "./SpellSearch.module.css";

export default function SpellSearch() {
  const [spells, setSpells] = useState<SpellSummary[]>([]);
  const [query, setQuery] = useState("");
  const [spell, setSpell] = useState<Spell | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSpellList(controller.signal)
      .then(setSpells)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, []);

  const match = useMemo(() => findClosestSpell(query, spells), [query, spells]);
  const matchUrl = match?.url;

  useEffect(() => {
    if (!matchUrl) return;
    const controller = new AbortController();
    fetchSpell(matchUrl, controller.signal)
      .then((s) => {
        setSpell(s);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [matchUrl]);

  const shown = query.trim() && matchUrl ? spell : null;
  const noMatch = query.trim() && spells.length > 0 && !match;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Spell Lookup</h1>
      <input
        className={styles.input}
        type="search"
        placeholder="Start typing a spell name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label="Spell name"
      />
      {error && <p role="alert" className={styles.message}>{error}</p>}
      {noMatch && <p className={styles.message}>No spell found.</p>}
      {shown && shown.index === match?.index && (
        <article className={styles.card}>
          <h2>{shown.name}</h2>
          <p className={styles.sub}>
            {levelLabel(shown)} · {shown.classes.map((c) => c.name).join(", ")}
          </p>
          <dl className={styles.stats}>
            <dt>Casting Time</dt><dd>{shown.casting_time}{shown.ritual ? " (ritual)" : ""}</dd>
            <dt>Range</dt><dd>{shown.range}</dd>
            <dt>Components</dt>
            <dd>{shown.components.join(", ")}{shown.material ? ` (${shown.material})` : ""}</dd>
            <dt>Duration</dt>
            <dd>{shown.concentration ? "Concentration, " : ""}{shown.duration}</dd>
          </dl>
          {shown.desc.map((p, i) => <p key={i}>{p}</p>)}
          {shown.higher_level?.map((p, i) => (
            <p key={`h${i}`}><strong>At Higher Levels.</strong> {p}</p>
          ))}
        </article>
      )}
    </main>
  );
}
