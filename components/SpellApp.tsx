"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocalStore } from "@/lib/localStore";
import { addToBook, removeFromBook, reorderWithinGroup, spellBook } from "@/lib/spellbook";
import type { Spell } from "@/lib/spells";
import CustomSpellForm from "./CustomSpellForm";
import { BookIcon, PlusIcon, SearchIcon } from "./icons";
import SpellBook from "./SpellBook";
import SpellSearch from "./SpellSearch";
import styles from "./SpellApp.module.css";

type Mode = "search" | "create" | "book";

const TITLES: Record<Mode, string> = {
  search: "Spell Lookup",
  create: "Create Your Own",
  book: "Spell Book",
};

export default function SpellApp() {
  const [mode, setMode] = useState<Mode>("search");
  const [saved, setSaved] = useLocalStore(spellBook);
  const savedIds = useMemo(() => new Set(saved.map((s) => s.index)), [saved]);

  const addSpell = (s: Spell) => setSaved((prev) => addToBook(prev, s));

  const tabs: { mode: Mode; label: string; icon: ReactNode; badge?: number }[] = [
    { mode: "search", label: "Search", icon: <SearchIcon /> },
    { mode: "create", label: "Create", icon: <PlusIcon /> },
    { mode: "book", label: "Book", icon: <BookIcon />, badge: saved.length },
  ];

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{TITLES[mode]}</h1>
        <nav className={styles.nav} aria-label="Sections">
          {tabs.map((t) => (
            <button
              key={t.mode}
              className={styles.tab}
              aria-current={mode === t.mode ? "page" : undefined}
              aria-label={t.badge ? `${t.label} (${t.badge} saved)` : t.label}
              onClick={() => setMode(t.mode)}
            >
              {t.icon}
              <span>{t.label}</span>
              {!!t.badge && <span className={styles.badge} aria-hidden="true">{t.badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      {/* search and create stay mounted while hidden so typed text and the spell list aren't lost */}
      <div hidden={mode !== "search"}>
        <SpellSearch savedIds={savedIds} onAdd={addSpell} />
      </div>
      <div hidden={mode !== "create"}>
        <CustomSpellForm saved={saved} onAdd={addSpell} />
      </div>
      {mode === "book" && (
        <SpellBook
          spells={saved}
          onReorder={(key, activeId, overId) =>
            setSaved((prev) => reorderWithinGroup(prev, key, activeId, overId))
          }
          onRemove={(index) => setSaved((prev) => removeFromBook(prev, index))}
        />
      )}
    </main>
  );
}
