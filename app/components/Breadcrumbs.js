'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

const labelMap = {
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  contacts: 'Contacts',
  accounts: 'Accounts',
  kb: 'Knowledge Base',
  reports: 'Reports',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
  profile: 'Profile',
};

function segmentToLabel(segment) {
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Split path and filter out empty segments and route groups like (dashboard)
  const segments = pathname
    .split('/')
    .filter((s) => s && !s.startsWith('('));

  if (segments.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
      <Link href="/dashboard" className={styles.homeIcon}>
        <Home size={14} />
      </Link>

      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = segmentToLabel(segment);

        return (
          <span key={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className={styles.separator}>
              <ChevronRight size={12} />
            </span>
            {isLast ? (
              <span className={styles.current}>{label}</span>
            ) : (
              <Link href={href} className={styles.link}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
