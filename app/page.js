import Link from 'next/link';
import { Zap, Shield, Brain, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Background decoration */}
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.bgGlowSecondary} aria-hidden="true" />

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.badge}>Enterprise Helpdesk Platform</span>

        <h1 className={styles.title}>ServiceDesk</h1>

        <p className={styles.subtitle}>
          Streamline your customer support with intelligent ticket management,
          SLA enforcement, and AI-powered assistance.
        </p>

        <div className={styles.ctas}>
          <Link href="/sign-in" className={styles.ctaPrimary}>
            Get Started
            <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className={styles.ctaOutline}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className={styles.features}>
        <div className={styles.card} style={{ animationDelay: '0.1s' }}>
          <div className={styles.iconWrap}>
            <Zap size={24} />
          </div>
          <h3 className={styles.cardTitle}>Smart Ticketing</h3>
          <p className={styles.cardDesc}>
            Multi-channel ticket management with automated routing and SLA
            tracking.
          </p>
        </div>

        <div className={styles.card} style={{ animationDelay: '0.25s' }}>
          <div className={styles.iconWrap}>
            <Shield size={24} />
          </div>
          <h3 className={styles.cardTitle}>SLA Compliance</h3>
          <p className={styles.cardDesc}>
            Enforce service level agreements with real-time countdown timers and
            breach alerts.
          </p>
        </div>

        <div className={styles.card} style={{ animationDelay: '0.4s' }}>
          <div className={styles.iconWrap}>
            <Brain size={24} />
          </div>
          <h3 className={styles.cardTitle}>AI Assistant</h3>
          <p className={styles.cardDesc}>
            AI-powered reply suggestions, ticket classification, and sentiment
            analysis.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        Built with Next.js
      </footer>
    </div>
  );
}
