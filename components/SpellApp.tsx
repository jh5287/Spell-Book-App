"use client";

import { useMemo, useState } from "react";
import { useLocalStore } from "@/lib/localStore";
import { addToBook, removeFromBook, reorderWithinLevel, spellBook } from "@/lib/spellbook";
import type { Spell } from "@/lib/spells";
import { BookIcon, SearchIcon } from "./icons";
import SpellBook from "./SpellBook";
import SpellSearch from "./SpellSearch";
import styles from "./SpellApp.module.css";

type Mode = "search" | "book";

export default function SpellApp() {
  const [mode, setMode] = useState<Mode>("search");
  const [saved, setSaved] = useLocalStore(spellBook);
  const savedIds = useMemo(() => new Set(saved.map((s) => s.index)), [saved]);

  const inSearch = mode === "search";

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{inSearch ? "Spell Lookup" : "Spell Book"}</h1>
        <button
          className={styles.modeButton}
          onClick={() => setMode(inSearch ? "book" : "search")}
          aria-label={inSearch ? `Open spell book (${saved.length} saved)` : "Back to spell search"}
          title={inSearch ? "Open spell book" : "Back to spell search"}
        >
          {inSearch ? <BookIcon /> : <SearchIcon />}
          {inSearch && saved.length > 0 && <span className={styles.badge}>{saved.length}</span>}
        </button>
      </header>

      {/* stays mounted while the book is open so the query and spell list aren't lost */}
      <div hidden={!inSearch}>
        <SpellSearch savedIds={savedIds} onAdd={(s: Spell) => setSaved((prev) => addToBook(prev, s))} />
      </div>
      {!inSearch && (
        <SpellBook
          spells={saved}
          onReorder={(level, activeId, overId) =>
            setSaved((prev) => reorderWithinLevel(prev, level, activeId, overId))
          }
          onRemove={(index) => setSaved((prev) => removeFromBook(prev, index))}
        />
      )}
    </main>
  );
}
