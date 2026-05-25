import Link from "next/link";
import styles from "./page.module.css";

const pillars = [
  {
    title: "Ceremonial booking flow",
    copy: "A calmer way to choose a virunnu slot. Availability, capacity, and privacy stay visible without turning the experience into a dashboard."
  },
  {
    title: "Host-led availability",
    copy: "Couples define windows, buffers, and blackout periods. Guests only see what the host intends to share."
  },
  {
    title: "Invite-first privacy",
    copy: "Private home-hosting needs restraint. Invite links, confirmations, and address reveal rules stay explicit and controlled."
  }
];

const steps = [
  "Host creates an event and sets availability rules.",
  "Guests open the invite and choose a valid slot.",
  "The system checks conflicts and confirms the booking."
];

export default function HomePage() {
  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.hero}>
        <div className={styles.eyebrow}>BookMyVirunnu</div>
        <h1>Ceremonial hospitality for the modern virunnu.</h1>
        <p className={styles.lead}>
          A premium booking experience for Kerala home-hosted gatherings. Designed to keep virunnu warm,
          private, and easy to coordinate without turning hospitality into a generic SaaS workflow.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="#experience">
            Explore the experience
          </Link>
          <Link className={styles.secondaryButton} href="#trust">
            Read the trust model
          </Link>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span>Host control</span>
            <strong>Availability, buffers, and blackouts</strong>
          </div>
          <div className={styles.statCard}>
            <span>Guest clarity</span>
            <strong>Conflicts explained with alternate slots</strong>
          </div>
          <div className={styles.statCard}>
            <span>Privacy first</span>
            <strong>Invite-only access and controlled address reveal</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="experience">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>Experience</div>
          <h2>Built for a quieter, more intentional booking journey.</h2>
        </div>

        <div className={styles.pillarGrid}>
          {pillars.map((pillar) => (
            <article key={pillar.title} className={styles.pillarCard}>
              <h3>{pillar.title}</h3>
              <p>{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.splitLayout}>
          <article className={styles.panel}>
            <div className={styles.sectionKicker}>How it works</div>
            <h2>One flow for hosts, one flow for guests.</h2>
            <ol className={styles.stepList}>
              {steps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className={styles.panelAccent} id="trust">
            <div className={styles.sectionKicker}>Trust model</div>
            <h2>Privacy and control are part of the product, not an afterthought.</h2>
            <p>
              Invite links are unlisted by default. Host addresses stay hidden until the booking rules allow
              disclosure. Conflict handling is neutral and explainable.
            </p>
            <div className={styles.notice}>
              Current deployment note: this frontend must be served from the <code>apps/web</code> project root in Vercel.
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
