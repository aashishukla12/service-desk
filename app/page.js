import Link from 'next/link';
import { FiPlus, FiGrid, FiLogIn } from 'react-icons/fi';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Service Desk Portal</h1>
        <p>Enterprise IT service management — streamlined, fast, and reliable.</p>
      </div>

      <div className={styles.cards}>
        <Link href="/tickets/new" className={styles.card}>
          <FiPlus />
          <h2>Create Ticket</h2>
          <p>Submit a new support request</p>
        </Link>

        <Link href="/agent/dashboard" className={styles.card}>
          <FiGrid />
          <h2>Agent Dashboard</h2>
          <p>View and manage the ticket queue</p>
        </Link>

        <Link href="/sign-in" className={styles.card}>
          <FiLogIn />
          <h2>Sign In</h2>
          <p>Authenticate to access the portal</p>
        </Link>
      </div>
    </div>
  );
}
