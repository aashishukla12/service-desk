import { Suspense } from 'react';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Suspense fallback={<aside style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--sidebar-bg)' }} />}>
        <Sidebar />
      </Suspense>
      <div className={styles.main}>
        <TopNav />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

