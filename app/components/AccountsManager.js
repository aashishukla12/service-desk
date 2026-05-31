'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Globe,
  Briefcase,
  Users,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Building
} from 'lucide-react';
import styles from './AccountsManager.module.css';

export default function AccountsManager({ initialAccounts, hasWriteAccess }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [activeAccount, setActiveAccount] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', website: '', industry: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.website && acc.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (acc.industry && acc.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setFormData({ name: '', website: '', industry: '' });
    setError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (acc) => {
    setActiveAccount(acc);
    setFormData({
      name: acc.name,
      website: acc.website || '',
      industry: acc.industry || '',
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (acc) => {
    setActiveAccount(acc);
    setIsDeleteModalOpen(true);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create account.');

      setAccounts((prev) => [...prev, data.account].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      showToast('Account created successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/accounts/${activeAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update account.');

      setAccounts((prev) =>
        prev.map((a) => (a.id === activeAccount.id ? { ...a, ...data.account } : a)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsEditModalOpen(false);
      showToast('Account updated successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${activeAccount.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete account.');

      setAccounts((prev) => prev.filter((a) => a.id !== activeAccount.id));
      setIsDeleteModalOpen(false);
      showToast('Account deleted successfully!');
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
          <h1 className={styles.title}>Company Accounts</h1>
          <p className={styles.subtitle}>
            Organize clients, manage company relationships, and track associated contacts.
          </p>
        </div>
        {hasWriteAccess && (
          <button className={styles.addBtn} onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search accounts by company name, website, or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Grid listing */}
      {filteredAccounts.length === 0 ? (
        <div className={styles.emptyState}>
          <Building size={40} className={styles.emptyIcon} />
          <h3>No Accounts Found</h3>
          <p>Create customer accounts to group contacts, assign SLAs, and manage client communications.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAccounts.map((acc) => {
            const initials = acc.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={acc.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>{initials}</div>
                  {hasWriteAccess && (
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openEditModal(acc)} title="Edit Account">
                        <Pencil size={13} />
                      </button>
                      <button className={styles.deleteIconBtn} onClick={() => openDeleteModal(acc)} title="Delete Account">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h2 className={styles.name}>{acc.name}</h2>
                  
                  {acc.website && (
                    <div className={styles.infoLine}>
                      <Globe size={13} className={styles.icon} />
                      <a href={acc.website.startsWith('http') ? acc.website : `https://${acc.website}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {acc.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {acc.industry && (
                    <div className={styles.infoLine}>
                      <Briefcase size={13} className={styles.icon} />
                      <span className={styles.text}>{acc.industry}</span>
                    </div>
                  )}

                  <div className={styles.infoLine}>
                    <Users size={13} className={styles.icon} />
                    <span className={styles.text}>{acc._count?.contacts || 0} Linked Contacts</span>
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
              <h2>Create Company Account</h2>
              <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Company/Account Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation, Stark Industries"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Website URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. www.acme.com"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Industry Vertical (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Software, Finance, Healthcare"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
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
              <h2>Edit Account Details</h2>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAccount} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Company/Account Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Website URL (Optional)</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Industry Vertical (Optional)</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                />
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
              <h2 className={styles.deleteTitle}>Delete Company Account?</h2>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.deleteBody}>
              <AlertCircle size={32} className={styles.deleteWarningIcon} />
              <p>
                Are you sure you want to delete the account <strong>{activeAccount?.name}</strong>?
              </p>
              <p className={styles.deleteSubText}>
                The company record will be permanently deleted. Any contact records linked to this company will not be deleted but safely set to unassociated.
              </p>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
