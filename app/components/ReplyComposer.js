'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, EyeOff, MessageSquare, AlertCircle } from 'lucide-react';
import styles from './ReplyComposer.module.css';

export default function ReplyComposer({ ticketId }) {
  const router = useRouter();
  const [isPrivate, setIsPrivate] = useState(false); // false = Public Reply, true = Internal Note
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (body.trim().length < 2) {
      setError('Message must be at least 2 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodyHtml: body.replace(/\n/g, '<br />'), // Simple HTML conversion
          isPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit reply.');
      }

      setBody('');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`${styles.composer} ${isPrivate ? styles.privateComposer : ''}`}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${!isPrivate ? styles.activeTab : ''}`}
          onClick={() => {
            setIsPrivate(false);
            setError('');
          }}
        >
          <MessageSquare size={14} />
          <span>Reply</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${isPrivate ? styles.activePrivateTab : ''}`}
          onClick={() => {
            setIsPrivate(true);
            setError('');
          }}
        >
          <EyeOff size={14} />
          <span>Internal Note</span>
        </button>
      </div>

      {/* Warning Alert for Private Notes */}
      {isPrivate && (
        <div className={styles.noteWarning}>
          <AlertCircle size={14} />
          <span>Internal notes are only visible to agents and admins. Customers cannot see them.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder={
            isPrivate
              ? 'Type private note for other agents…'
              : 'Type reply to the customer…'
          }
          rows={4}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setError('');
          }}
          disabled={isSubmitting}
        />

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="submit"
            className={`${styles.submitBtn} ${isPrivate ? styles.privateSubmitBtn : ''}`}
            disabled={isSubmitting || !body.trim()}
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Sending…' : isPrivate ? 'Add Note' : 'Send Reply'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
