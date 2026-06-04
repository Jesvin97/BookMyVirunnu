import Link from "next/link";
import styles from "./page.module.css";

const pillars = [
  {
    title: "The Ceremonial Flow",
    copy: "A serene way for guests to select their virunnu slot. Capacity and privacy are elegantly managed without feeling like a corporate tool."
  },
  {
    title: "Curated Availability",
    copy: "You set the pace. Define hosting windows, rest buffers, and blackout dates. Guests only see the moments you choose to share."
  },
  {
    title: "Uncompromised Privacy",
    copy: "Intimate gatherings demand discretion. Our secure invite links and timed address reveals ensure you always remain in control."
  }
];

const steps = [
  "You curate the event and establish your hosting availability.",
  "Invited guests seamlessly select a slot that works for them.",
  "We handle the scheduling gracefully and instantly confirm the gathering."
];

export default function HomePage() {
  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.hero}>
        <div className={styles.eyebrow}>BookMyVirunnu</div>
        <h1>Elevate the Tradition of Virunnu.</h1>
        <p className={styles.lead}>
          A sophisticated, invite-only booking experience for Kerala's home-hosted gatherings. We preserve the warmth and privacy of traditional hospitality, reimagined for the modern host.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/couple/quick-create">
            Newlyweds: Curate Your Calendar
          </Link>
          <Link className={styles.secondaryButton} href="/login">
            Guest Login / Dashboard
          </Link>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span>Host Exclusivity</span>
            <strong>Complete control over dates, buffers, and blackout periods.</strong>
          </div>
          <div className={styles.statCard}>
            <span>Seamless Clarity</span>
            <strong>Smart scheduling with polite alternative slot suggestions.</strong>
          </div>
          <div className={styles.statCard}>
            <span>Absolute Privacy</span>
            <strong>Invite-only access with delayed, secure address reveals.</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="experience">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>Experience</div>
          <h2>Crafted for an intentional, graceful booking journey.</h2>
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
            <h2>Effortless for hosts. Intuitive for guests.</h2>
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
            <div className={styles.sectionKicker}>The Trust Model</div>
            <h2>Built on discretion and peace of mind.</h2>
            <p>
              Your privacy is our priority. Invite links are inherently unlisted, and your address is securely hidden until the booking is fully confirmed. We handle any scheduling conflicts with neutral grace, ensuring every guest feels welcome.
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
