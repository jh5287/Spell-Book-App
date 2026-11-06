"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSpell,
  fetchSpellList,
  findClosestSpell,
  type Spell,
  type SpellSummary,
} from "@/lib/spells";
import SpellCard from "./SpellCard";
import styles from "./SpellSearch.module.css";

interface Props {
  savedIds: ReadonlySet<string>;
  onAdd: (spell: Spell) => void;
}

export default function SpellSearch({ savedIds, onAdd }: Props) {
  const [spells, setSpells] = useState<SpellSummary[]>([]);
  const [query, setQuery] = useState("");
  const [spell, setSpell] = useState<Spell | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleAdd(s: Spell) {
    onAdd(s);
    setAdded(s.name);
    // keep the text selected so the next keystroke starts a new lookup
    inputRef.current?.select();
  }

  return (
    <section className={styles.container}>
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        placeholder="Start typing a spell name…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setAdded(null);
        }}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label="Spell name"
      />
      <p role="status" className={styles.status}>{added && `Added ${added} to your book.`}</p>
      {error && <p role="alert" className={styles.message}>{error}</p>}
      {noMatch && <p className={styles.message}>No spell found.</p>}
      {shown && shown.index === match?.index && (
        <SpellCard
          spell={shown}
          actions={
            savedIds.has(shown.index) ? (
              <button className="btn" disabled>✓ In your book</button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleAdd(shown)}>Add to book</button>
            )
          }
        />
      )}
    </section>
  );
}
