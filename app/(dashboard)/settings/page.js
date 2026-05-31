import Link from 'next/link';
import { Users, Building, ShieldAlert, Sliders } from 'lucide-react';
import styles from './Settings.module.css';

export const metadata = {
  title: 'Settings — ServiceDesk',
};

export default function SettingsPage() {
  const sections = [
    {
      title: 'Agent Management',
      description: 'Manage helpdesk agents, roles, status, and department assignments.',
      href: '/settings/agents',
      icon: <Users size={24} />,
    },
    {
      title: 'Departments',
      description: 'Configure and organize support departments, emails, and timezones.',
      href: '/settings/departments',
      icon: <Building size={24} />,
    },
    {
      title: 'SLA Policies',
      description: 'Define service level targets for response and resolution times.',
      href: '/settings/sla',
      icon: <ShieldAlert size={24} />,
    },
    {
      title: 'General Settings',
      description: 'Configure system settings, business hours, and portal defaults.',
      href: '/settings/general',
      icon: <Sliders size={24} />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your organization preferences, service policies, and support staff.</p>
      </div>

      <div className={styles.grid}>
        {sections.map((section) => (
          <Link href={section.href} key={section.title} className={styles.card}>
            <div className={styles.iconWrapper}>{section.icon}</div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardDesc}>{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
