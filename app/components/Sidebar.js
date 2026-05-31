'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import {
  Hexagon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Inbox,
  Users,
  Building2,
  BookOpen,
  BarChart3,
  Settings,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const STORAGE_KEY = 'sidebar-collapsed';

const navItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    icon: Inbox,
    label: 'Tickets',
    href: '/tickets',
    badge: 12,
    subItems: [
      { label: 'All Tickets', href: '/tickets' },
      { label: 'My Tickets', href: '/tickets?filter=mine' },
      { label: 'Unassigned', href: '/tickets?filter=unassigned' },
      { label: 'Overdue', href: '/tickets?filter=overdue' },
    ],
  },
  {
    icon: Users,
    label: 'Contacts',
    href: '/contacts',
    badge: 3,
  },
  {
    icon: Building2,
    label: 'Accounts',
    href: '/accounts',
  },
  {
    icon: BookOpen,
    label: 'Knowledge Base',
    href: '/kb',
  },
  {
    icon: BarChart3,
    label: 'Reports',
    href: '/reports',
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/settings',
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const userName = session?.user?.name || 'Agent';
  const userRole = session?.user?.role || 'AGENT';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Persist collapsed state to localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Auto-expand tickets sub-menu if current path is a ticket path
  useEffect(() => {
    if (pathname.startsWith('/tickets')) {
      setTicketsOpen(true);
    }
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/tickets') {
      return pathname === '/tickets' || pathname.startsWith('/tickets');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isSubItemActive = (href) => {
    // For query-based routes, do exact match
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const params = new URLSearchParams(query);
      const filterVal = params.get('filter');
      return pathname === path && searchParams.get('filter') === filterVal;
    }
    // For /tickets with no filter, only match exact
    return pathname === href && !searchParams.get('filter');
  };

  return (
    <>
      <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Hexagon size={20} />
            </div>
            <span className={styles.brandName}>ServiceDesk</span>
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems
            .filter((item) => {
              // Hide Settings sidebar section from non-admin users
              if (item.href === '/settings' && userRole !== 'ADMIN') {
                return false;
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              if (hasSubItems) {
                return (
                  <div key={item.href} className={styles.navSection}>
                    <button
                      className={clsx(styles.navItem, active && styles.active)}
                      onClick={() => setTicketsOpen((prev) => !prev)}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={styles.navIcon}>
                        <Icon size={18} />
                      </span>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge && (
                        <span className={styles.navBadge}>{item.badge}</span>
                      )}
                      <span
                        className={clsx(
                          styles.expandArrow,
                          ticketsOpen && styles.expanded
                        )}
                      >
                        <ChevronDown size={14} />
                      </span>
                    </button>

                    <div
                      className={clsx(
                        styles.subItems,
                        ticketsOpen && styles.open
                      )}
                    >
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={clsx(
                            styles.subItem,
                            isSubItemActive(sub.href) && styles.active
                          )}
                        >
                          <span className={styles.subItemDot} />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(styles.navItem, active && styles.active)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.navIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Footer — User card */}
        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>
                {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
