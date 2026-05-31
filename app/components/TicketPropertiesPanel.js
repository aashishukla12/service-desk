'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  User as UserIcon,
  Calendar,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  getStatusLabel,
  getPriorityLabel,
  formatDateTime,
  getInitials,
} from '@/lib/utils';
import styles from './TicketPropertiesPanel.module.css';

export default function TicketPropertiesPanel({
  ticket,
  staffUsers,
  departments,
  currentUser,
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Dropdown options
  const statusOptions = [
    'OPEN',
    'IN_PROGRESS',
    'ON_HOLD',
    'PENDING_CUSTOMER',
    'RESOLVED',
    'CLOSED',
  ];
  const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  // Role-Based Access Control logic:
  // If current user is not Admin, and the ticket is assigned to a different agent, the controls are LOCKED.
  const isUserAdmin = currentUser?.role === 'ADMIN';
  const isAssignedToOther = ticket.assigneeId !== null && ticket.assigneeId !== currentUser?.id;
  const isLocked = !isUserAdmin && isAssignedToOther;

  // Retrieve name of assigned agent
  const assignedAgentName = ticket.assignee?.name || 'another agent';

  const handleUpdate = async (field, value) => {
    if (isLocked) return;
    setUpdating(true);
    setError('');

    // Format null values correctly
    const formattedValue = value === '' ? null : value;

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: formattedValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update ticket parameter');
      }

      router.refresh();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setUpdating(false);
    }
  };

  // Quick Resolve Handler
  const handleResolve = () => {
    handleUpdate('status', 'RESOLVED');
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Properties</h3>
        {updating && <Loader2 size={14} className={styles.spin} />}
      </div>

      {isLocked && (
        <div className={styles.lockAlert}>
          This ticket is assigned to <strong>{assignedAgentName}</strong>. Only they or an administrator can modify its properties.
        </div>
      )}

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.properties}>
        {/* Quick Action Button if ticket is not resolved/closed */}
        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
          <button
            onClick={handleResolve}
            className={styles.resolveBtn}
            disabled={updating || isLocked}
          >
            <CheckCircle2 size={15} />
            Resolve Ticket
          </button>
        )}

        {/* Status Dropdown */}
        <div className={styles.property}>
          <span className={styles.propLabel}>Status</span>
          <select
            value={ticket.status}
            onChange={(e) => handleUpdate('status', e.target.value)}
            disabled={updating || isLocked}
            className={styles.select}
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {getStatusLabel(opt)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className={styles.property}>
          <span className={styles.propLabel}>Priority</span>
          <select
            value={ticket.priority}
            onChange={(e) => handleUpdate('priority', e.target.value)}
            disabled={updating || isLocked}
            className={styles.select}
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {getPriorityLabel(opt)}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Dropdown */}
        <div className={styles.property}>
          <span className={styles.propLabel}>Assignee</span>
          <select
            value={ticket.assigneeId || ''}
            onChange={(e) => handleUpdate('assigneeId', e.target.value)}
            disabled={updating || isLocked}
            className={styles.select}
          >
            <option value="">Unassigned</option>
            {staffUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div className={styles.property}>
          <span className={styles.propLabel}>Department</span>
          <select
            value={ticket.departmentId || ''}
            onChange={(e) => handleUpdate('departmentId', e.target.value)}
            disabled={updating || isLocked}
            className={styles.select}
          >
            <option value="">None</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Phone (Static) */}
        <div className={styles.propertyStatic}>
          <span className={styles.propLabel}>Contact Phone</span>
          <span className={styles.propValue}>
            {ticket.contact?.phone || <span className={styles.unassigned}>None</span>}
          </span>
        </div>

        {/* Created Timestamp */}
        <div className={styles.propertyStatic}>
          <span className={styles.propLabel}>Created</span>
          <span className={styles.propValue}>
            <div className={styles.dateBadge}>
              <Calendar size={12} />
              <span>{formatDateTime(ticket.createdAt)}</span>
            </div>
          </span>
        </div>

        {/* Last Updated Timestamp */}
        <div className={styles.propertyStatic}>
          <span className={styles.propLabel}>Last Updated</span>
          <span className={styles.propValue}>
            <div className={styles.dateBadge}>
              <Calendar size={12} />
              <span>{formatDateTime(ticket.updatedAt)}</span>
            </div>
          </span>
        </div>
      </div>
    </div>
  );
}
