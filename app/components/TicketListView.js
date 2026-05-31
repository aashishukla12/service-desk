'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Ticket,
  User,
  Clock,
  Filter,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import {
  getStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
  formatRelativeTime,
  getInitials,
} from '@/lib/utils';
import styles from './TicketListView.module.css';

export default function TicketListView({ initialTickets, activeFilter = 'all' }) {
  const router = useRouter();
  const tickets = initialTickets || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt', 'priority', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Derive dynamic header based on active filter
  const filterTitles = {
    all: 'All Tickets',
    mine: 'My Tickets',
    unassigned: 'Unassigned Tickets',
    overdue: 'Overdue Tickets',
  };
  const pageTitle = filterTitles[activeFilter] || 'Tickets';

  // Handle client-side filtering & sorting
  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.contact?.name && t.contact.name.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // 3. Priority Filter
    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tickets, search, statusFilter, priorityFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const statusOptions = ['ALL', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED'];
  const priorityOptions = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{pageTitle}</h1>
          <span className={styles.count}>{filteredAndSortedTickets.length} tickets</span>
        </div>
        <Link href="/tickets/new" className={styles.createBtn}>
          <Plus size={16} />
          Create Ticket
        </Link>
      </div>

      {/* Filter Bar */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by subject, contact, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.selectGroup}>
          <div className={styles.selectWrapper}>
            <Filter size={13} className={styles.selectIcon} />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  Status: {opt === 'ALL' ? 'All' : getStatusLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <Filter size={13} className={styles.selectIcon} />
            <select
              className={styles.filterSelect}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              {priorityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  Priority: {opt === 'ALL' ? 'All' : getPriorityLabel(opt)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => toggleSort('subject')} className={styles.sortableHeader}>
                  Subject <ArrowUpDown size={12} />
                </th>
                <th onClick={() => toggleSort('status')} className={styles.sortableHeader}>
                  Status <ArrowUpDown size={12} />
                </th>
                <th onClick={() => toggleSort('priority')} className={styles.sortableHeader}>
                  Priority <ArrowUpDown size={12} />
                </th>
                <th>Assignee</th>
                <th>Department</th>
                <th onClick={() => toggleSort('createdAt')} className={styles.sortableHeader}>
                  Created <ArrowUpDown size={12} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <Ticket size={48} className={styles.emptyIcon} />
                      <h3>No Tickets Found</h3>
                      <p>Try resetting your filters or create a new ticket to get started.</p>
                      {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('ALL');
                            priorityFilter !== 'ALL' && setPriorityFilter('ALL');
                          }}
                          className={styles.resetBtn}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.status);
                  const priorityColor = getPriorityColor(ticket.priority);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className={styles.clickableRow}
                    >
                      <td className={styles.subjectCell}>
                        <div className={styles.subjectText}>{ticket.subject}</div>
                        <div className={styles.metaRow}>
                          <span className={styles.ticketId}>#{ticket.id.slice(0, 8)}</span>
                          {ticket.contact && (
                            <>
                              <span className={styles.metaSep}>•</span>
                              <span className={styles.contactName}>{ticket.contact.name}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                          }}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor: `${priorityColor}15`,
                            color: priorityColor,
                          }}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td>
                        {ticket.assignee ? (
                          <div className={styles.avatarCell}>
                            <div className={styles.avatar}>
                              {getInitials(ticket.assignee.name)}
                            </div>
                            <span className={styles.avatarName}>{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {ticket.department ? (
                          <div className={styles.deptCell}>
                            <Building size={14} className={styles.deptIcon} />
                            <span>{ticket.department.name}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>None</span>
                        )}
                      </td>
                      <td className={styles.dateCell}>
                        <div className={styles.dateText}>
                          {formatRelativeTime(ticket.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
