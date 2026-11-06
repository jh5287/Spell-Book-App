import type { ReactNode } from "react";
import type { BookView } from "@/lib/spellbook";
import { levelLabel, type Spell } from "@/lib/spells";
import styles from "./SpellCard.module.css";

interface Props {
  spell: Spell;
  variant?: BookView;
  headingLevel?: 2 | 3;
  /** Drag handle, rendered at the start of the card. */
  handle?: ReactNode;
  /** Buttons, rendered at the end of the card. */
  actions?: ReactNode;
}

function Details({ spell }: { spell: Spell }) {
  return (
    <>
      <dl className={styles.stats}>
        <dt>Casting Time</dt><dd>{spell.casting_time}{spell.ritual ? " (ritual)" : ""}</dd>
        <dt>Range</dt><dd>{spell.range}</dd>
        <dt>Components</dt>
        <dd>{spell.components.join(", ")}{spell.material ? ` (${spell.material})` : ""}</dd>
        <dt>Duration</dt>
        <dd>{spell.concentration ? "Concentration, " : ""}{spell.duration}</dd>
      </dl>
      {spell.description.split("\n").map((p, i) => <p key={i}>{p.trim()}</p>)}
      {spell.higher_level && (
        <p><strong>Using a Higher-Level Spell Slot.</strong> {spell.higher_level}</p>
      )}
    </>
  );
}

function Tags({ spell }: { spell: Spell }) {
  return (
    <>
      {spell.concentration && <span className={styles.tag} title="Concentration">C</span>}
      {spell.ritual && <span className={styles.tag} title="Ritual">R</span>}
    </>
  );
}

export default function SpellCard({ spell, variant = "full", headingLevel = 2, handle, actions }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  if (variant === "full") {
    return (
      <article className={styles.card}>
        <header className={styles.header}>
          {handle}
          <div className={styles.titleBlock}>
            <Heading className={styles.name}>{spell.name}</Heading>
            <p className={styles.sub}>
              {levelLabel(spell)} · {spell.classes.map((c) => c.name).join(", ")}
            </p>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
        <Details spell={spell} />
      </article>
    );
  }

  return (
    <article className={`${styles.card} ${styles.row}`}>
      {handle}
      <details className={styles.details}>
        <summary className={`${styles.summary} ${variant === "list" ? styles.listSummary : ""}`}>
          <Heading className={styles.rowName}>{spell.name} <Tags spell={spell} /></Heading>
          {variant === "list" ? (
            <>
              <span className={styles.col}>{spell.school.name}</span>
              <span className={styles.col}>{spell.casting_time}</span>
              <span className={styles.col}>{spell.range}</span>
              <span className={styles.col}>{spell.duration}</span>
            </>
          ) : (
            <span className={styles.meta}>
              {spell.school.name} · {spell.casting_time} · {spell.range}
            </span>
          )}
        </summary>
        <div className={styles.expanded}>
          <p className={styles.sub}>{spell.classes.map((c) => c.name).join(", ")}</p>
          <Details spell={spell} />
        </div>
      </details>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}
