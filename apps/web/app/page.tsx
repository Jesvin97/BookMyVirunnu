"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SmoothScroll from "./SmoothScroll";
import styles from "./page.module.css";

const what = {
  title: "What is it?",
  copy: "BookOurVirunnu is a dedicated scheduling and invitation platform built specifically for newlyweds and their families to seamlessly organize post-wedding feasts without the chaos of overlapping guests."
};

const why = {
  title: "Why use BookOurVirunnu?",
  copy: "Organizing post-wedding feasts usually involves endless phone calls, accidental double-bookings, and privacy concerns. This platform solves that by giving hosts complete control over their availability, ensuring guests pick slots that actually work, preventing overcrowding, and keeping your home address secure until the booking is confirmed."
};

const how = {
  title: "How does it work?",
  steps: [
    "Curate: The newlyweds (or their families) create a private calendar, setting available dates, meals, and resting blackout dates.",
    "Share: A secure, unique Feast ID or private link is shared with extended family and friends.",
    "Book: Guests log in with the Feast ID, pick an open slot, and get instant confirmation along with the host's private home address."
  ]
};

const where = {
  title: "Where does this fit in?",
  copy: "This platform is designed specifically for home-hosted events across Kerala (or anywhere the diaspora celebrates). It acts as the digital bridge between your private residence and your extended family, ensuring your home is never overwhelmed by too many guests at once."
};

const when = {
  title: "When is the right time to use it?",
  copy: "Set up your BookOurVirunnu calendar 1-2 weeks before the wedding. Share the link with guests during or immediately after the wedding ceremony so they can begin booking their visits for the following weeks."
};

export default function HomePage() {
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50, damping: 20 } }
  };

  return (
    <SmoothScroll>
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <motion.section 
        className={styles.hero}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.img variants={fadeInUp} src="/logoBOV.svg" alt="BookOurVirunnu Logo" className={styles.logo} />
        <motion.h1 variants={fadeInUp}>BookOurVirunnu</motion.h1>
        <motion.h2 variants={fadeInUp} className={styles.heroSubtitle}>The Kerala Ceremonial Hospitality Manager.</motion.h2>
        <motion.p variants={fadeInUp} className={styles.lead}>
          {what.copy}
        </motion.p>

        <motion.div variants={fadeInUp} className={styles.actions}>
          <Link className={styles.primaryButton} href="/couple/quick-create">
            Newlyweds: Curate Your Calendar
          </Link>
          <Link className={styles.secondaryButton} href="/login">
            Guest Login / Dashboard
          </Link>
        </motion.div>
      </motion.section>

      <motion.section 
        className={styles.section} 
        id="why"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>Why</div>
          <h2>{why.title}</h2>
          <p className={styles.lead} style={{ margin: "16px auto 0" }}>{why.copy}</p>
        </div>
      </motion.section>

      <motion.section 
        className={styles.section} 
        id="how"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <div className={styles.splitLayout}>
          <article className={styles.panel}>
            <div className={styles.sectionKicker}>How</div>
            <h2>{how.title}</h2>
            <ol className={styles.stepList}>
              {how.steps.map((step, index) => {
                const [boldPart, rest] = step.split(": ");
                return (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p><strong>{boldPart}:</strong> {rest}</p>
                  </li>
                );
              })}
            </ol>
          </article>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <article className={styles.panelAccent} id="where">
              <div className={styles.sectionKicker}>Where</div>
              <h2>{where.title}</h2>
              <p>{where.copy}</p>
            </article>

            <article className={styles.panelAccent} id="when">
              <div className={styles.sectionKicker}>When</div>
              <h2>{when.title}</h2>
              <p>{when.copy}</p>
            </article>
          </div>
        </div>
      </motion.section>
    </main>
    </SmoothScroll>
  );
}
