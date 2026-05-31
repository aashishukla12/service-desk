'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { clsx } from 'clsx';
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import styles from './TopNav.module.css';

export default function TopNav() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userName = session?.user?.name || 'Alex Johnson';
  const userEmail = session?.user?.email || 'alex@servicedesk.io';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className={styles.topNav}>
      {/* Mobile menu button (placeholder — toggle handled by sidebar context) */}
      <button className={styles.mobileMenuBtn} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Left — Breadcrumbs */}
      <div className={styles.left}>
        <Breadcrumbs />
      </div>

      {/* Center — Search */}
      <div className={styles.center}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tickets, contacts... (Ctrl+K)"
            aria-label="Search"
          />
          <span className={styles.searchShortcut}>
            <kbd className={styles.kbd}>Ctrl</kbd>
            <kbd className={styles.kbd}>K</kbd>
          </span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className={styles.right}>
        {/* Quick create */}
        <Link href="/tickets/new" className={styles.createBtn} title="Create Ticket">
          <Plus size={18} />
        </Link>

        {/* Notifications */}
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>

        <div className={styles.separator} />

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className={styles.userBtn}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.userAvatar}>{initials}</div>
            <span className={styles.userBtnName}>{userName}</span>
            <ChevronDown
              size={14}
              className={clsx(styles.userBtnChevron, dropdownOpen && styles.open)}
            />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownName}>{userName}</div>
                <div className={styles.dropdownEmail}>{userEmail}</div>
              </div>
              <Link
                href="/settings/profile"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <User size={15} />
                Profile
              </Link>
              <Link
                href="/settings"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={15} />
                Settings
              </Link>
              <div className={styles.dropdownSep} />
              <button
                className={clsx(styles.dropdownItem, styles.danger)}
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
