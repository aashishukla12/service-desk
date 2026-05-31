'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle, Sparkles } from 'lucide-react';
import styles from './CreateTicketForm.module.css';

const priorities = [
  { value: 'LOW', label: 'Low', detail: '48 hour SLA' },
  { value: 'MEDIUM', label: 'Medium', detail: '24 hour SLA' },
  { value: 'HIGH', label: 'High', detail: '4 hour SLA' },
  { value: 'URGENT', label: 'Urgent', detail: '1 hour SLA' },
];

const channels = [
  { value: 'WEB', label: 'Web Portal' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'CHAT', label: 'Live Chat' },
];

export default function CreateTicketForm({ departments = [], contacts = [], agents = [] }) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [channel, setChannel] = useState('WEB');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [contactId, setContactId] = useState(contacts[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          priority,
          channel,
          departmentId: departmentId || undefined,
          contactId: contactId || undefined,
          assigneeId: assigneeId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create ticket.');
      }

      router.push(`/tickets/${data.ticket.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className={styles.title}>Submit Support Ticket</h1>
          <p className={styles.subtitle}>
            Please describe your request in detail. Our agents will assist you shortly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Subject */}
        <div className={styles.field}>
          <label htmlFor="ticket-subject" className={styles.label}>
            Subject
          </label>
          <input
            id="ticket-subject"
            type="text"
            className={styles.input}
            placeholder="Summarize your issue..."
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setError('');
            }}
            maxLength={160}
          />
          <small className={styles.count}>{subject.length}/160</small>
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label htmlFor="ticket-desc" className={styles.label}>
            Description
          </label>
          <textarea
            id="ticket-desc"
            className={styles.textarea}
            rows={6}
            placeholder="Provide step-by-step instructions, error messages, and what you've tried..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            maxLength={5000}
          />
          <small className={styles.count}>{description.length}/5000</small>
        </div>

        {/* Meta Grid */}
        <div className={styles.metaGrid}>
          {/* Contact (Customer) */}
          <div className={styles.field}>
            <label htmlFor="ticket-contact" className={styles.label}>
              Contact Name (Customer)
            </label>
            <select
              id="ticket-contact"
              className={styles.select}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
            >
              <option value="" disabled>Select Customer...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className={styles.field}>
            <label htmlFor="ticket-dept" className={styles.label}>
              Department
            </label>
            <select
              id="ticket-dept"
              className={styles.select}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="" disabled>Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee (Owner) */}
          <div className={styles.field}>
            <label htmlFor="ticket-assignee" className={styles.label}>
              Assignee (Owner)
            </label>
            <select
              id="ticket-assignee"
              className={styles.select}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role === 'ADMIN' ? 'Admin' : 'Agent'})
                </option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div className={styles.field}>
            <label htmlFor="ticket-channel" className={styles.label}>
              Contact Channel
            </label>
            <select
              id="ticket-channel"
              className={styles.select}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {channels.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Selector */}
        <fieldset className={styles.priorityGroup}>
          <legend className={styles.legend}>Ticket Priority</legend>
          <div className={styles.prioritiesGrid}>
            {priorities.map((p) => (
              <label
                key={p.value}
                className={`${styles.priorityOption} ${
                  priority === p.value ? styles.priorityChecked : ''
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className={styles.radioInput}
                />
                <span className={styles.priorityLabel}>
                  <b>{p.label}</b>
                  <small>{p.detail}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Errors */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          <Send size={15} />
          {isSubmitting ? 'Creating Ticket...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
