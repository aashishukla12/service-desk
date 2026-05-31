'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  User,
  Users
} from 'lucide-react';
import styles from './ContactsManager.module.css';

export default function ContactsManager({ initialContacts, accounts, hasWriteAccess }) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [activeContact, setActiveContact] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', accountId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.account && c.account.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '', accountId: '' });
    setError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (contact) => {
    setActiveContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      accountId: contact.accountId || '',
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (contact) => {
    setActiveContact(contact);
    setIsDeleteModalOpen(true);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create contact.');

      setContacts((prev) => [...prev, data.contact].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      showToast('Contact added successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/contacts/${activeContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update contact.');

      setContacts((prev) =>
        prev.map((c) => (c.id === activeContact.id ? { ...c, ...data.contact } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsEditModalOpen(false);
      showToast('Contact updated successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${activeContact.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete contact.');

      setContacts((prev) => prev.filter((c) => c.id !== activeContact.id));
      setIsDeleteModalOpen(false);
      showToast('Contact deleted successfully!');
      router.refresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customer Contacts</h1>
          <p className={styles.subtitle}>
            View and manage external client contacts, associated accounts, and support ticket origins.
          </p>
        </div>
        {hasWriteAccess && (
          <button className={styles.addBtn} onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search contacts by name, email, phone, or company account..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Grid listing */}
      {filteredContacts.length === 0 ? (
        <div className={styles.emptyState}>
          <User size={40} className={styles.emptyIcon} />
          <h3>No Contacts Found</h3>
          <p>Create client records to begin tracking accounts, phone numbers, and organization associations.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredContacts.map((contact) => {
            const initials = contact.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={contact.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>{initials}</div>
                  {hasWriteAccess && (
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openEditModal(contact)} title="Edit Contact">
                        <Pencil size={13} />
                      </button>
                      <button className={styles.deleteIconBtn} onClick={() => openDeleteModal(contact)} title="Delete Contact">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h2 className={styles.name}>{contact.name}</h2>
                  
                  <div className={styles.infoLine}>
                    <Mail size={13} className={styles.icon} />
                    <span className={styles.text} title={contact.email}>{contact.email}</span>
                  </div>

                  <div className={styles.infoLine}>
                    <Phone size={13} className={styles.icon} />
                    <span className={styles.text}>{contact.phone || 'No phone number'}</span>
                  </div>

                  <div className={styles.infoLine}>
                    <Building size={13} className={styles.icon} />
                    <span className={contact.account ? styles.accountText : styles.mutedText}>
                      {contact.account ? contact.account.name : 'Unassigned Account'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Create Customer Contact</h2>
              <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Full Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address <span className={styles.required}>*</span></label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@client.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Associated Company Account (Optional)</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="">No Associated Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Contact Details</h2>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditContact} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Full Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address <span className={styles.required}>*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Associated Company Account (Optional)</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="">No Associated Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.deleteTitle}>Delete Client Contact?</h2>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.deleteBody}>
              <AlertCircle size={32} className={styles.deleteWarningIcon} />
              <p>
                Are you sure you want to delete the contact for <strong>{activeContact?.name}</strong>?
              </p>
              <p className={styles.deleteSubText}>
                The contact will be permanently deleted. Any support tickets linked to this customer will be preserved but safely set to unassociated.
              </p>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteContact}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
