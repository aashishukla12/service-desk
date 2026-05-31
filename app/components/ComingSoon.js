'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';
import styles from './ComingSoon.module.css';

export default function ComingSoon({ featureName, phase }) {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Construction size={40} className={styles.icon} />
        </div>
        <h1 className={styles.title}>{featureName || 'Feature'} Under Construction</h1>
        <p className={styles.description}>
          We are hard at work building this section! This feature is scheduled for release in{' '}
          <span className={styles.highlight}>{phase || 'a future phase'}</span> of the ServiceDesk rollout.
        </p>
        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link href="/settings" className={styles.homeBtn}>
            Settings Home
          </Link>
        </div>
      </div>
    </div>
  );
}
