'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Building2,
  Mail,
  Globe,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Users,
  Inbox,
  Clock
} from 'lucide-react';
import styles from './DepartmentsManager.module.css';

export default function DepartmentsManager({ initialDepartments }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [activeDept, setActiveDept] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', emailAddress: '', timezone: 'UTC' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.emailAddress && dept.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setFormData({ name: '', emailAddress: '', timezone: 'UTC' });
    setError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (dept) => {
    setActiveDept(dept);
    setFormData({
      name: dept.name,
      emailAddress: dept.emailAddress || '',
      timezone: dept.timezone || 'UTC',
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (dept) => {
    setActiveDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Department Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create department.');

      // Serialize createdAt if needed
      const newDept = {
        ...data.department,
        _count: { users: 0, tickets: 0 }
      };

      setDepartments((prev) => [...prev, newDept].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      showToast('Department created successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Department Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/departments/${activeDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update department.');

      setDepartments((prev) =>
        prev.map((d) => (d.id === activeDept.id ? { ...d, ...data.department } : d)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsEditModalOpen(false);
      showToast('Department updated successfully!');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${activeDept.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete department.');

      setDepartments((prev) => prev.filter((d) => d.id !== activeDept.id));
      setIsDeleteModalOpen(false);
      showToast('Department deleted successfully!');
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
          <h1 className={styles.title}>Configure Support Departments</h1>
          <p className={styles.subtitle}>
            Organize tickets, assign agents, and manage customer service operations by functional areas.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search and Filter Panel */}
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search departments by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Grid Listing */}
      {filteredDepartments.length === 0 ? (
        <div className={styles.emptyState}>
          <Building2 size={40} className={styles.emptyIcon} />
          <h3>No Departments Found</h3>
          <p>Create your first support department to get started organizing your helpdesk queue.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredDepartments.map((dept) => (
            <div key={dept.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <Building2 size={18} />
                </div>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => openEditModal(dept)} title="Edit Department">
                    <Pencil size={14} />
                  </button>
                  <button className={styles.deleteIconBtn} onClick={() => openDeleteModal(dept)} title="Delete Department">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h2 className={styles.deptName}>{dept.name}</h2>
                
                <div className={styles.metaRow}>
                  <Mail size={13} className={styles.metaIcon} />
                  <span className={styles.metaText} title={dept.emailAddress || 'No linked email'}>
                    {dept.emailAddress || 'No linked support email'}
                  </span>
                </div>
                
                <div className={styles.metaRow}>
                  <Clock size={13} className={styles.metaIcon} />
                  <span className={styles.metaText}>Timezone: {dept.timezone}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.metric}>
                  <Users size={14} />
                  <span>{dept._count?.users || 0} Staff</span>
                </div>
                <div className={styles.metric}>
                  <Inbox size={14} />
                  <span>{dept._count?.tickets || 0} Tickets</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Create New Department</h2>
              <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Department Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Technical Support, Billing, Customer Success"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Support Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. support@company.com"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, emailAddress: e.target.value }))}
                />
                <p className={styles.helpText}>Customer replies to this address will automatically route into this department.</p>
              </div>

              <div className={styles.formGroup}>
                <label>Operating Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                >
                  <option value="UTC">UTC (GMT+00:00)</option>
                  <option value="America/New_York">Eastern Time (EST/EDT)</option>
                  <option value="America/Chicago">Central Time (CST/CDT)</option>
                  <option value="America/Denver">Mountain Time (MST/MDT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Asia/Singapore">Singapore Time (SGT)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                  <option value="Australia/Sydney">Sydney Time (AEST/AEDT)</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Department'}
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
              <h2>Edit Department Details</h2>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditDepartment} className={styles.form}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Department Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Technical Support"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Support Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. billing@company.com"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, emailAddress: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Operating Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                >
                  <option value="UTC">UTC (GMT+00:00)</option>
                  <option value="America/New_York">Eastern Time (EST/EDT)</option>
                  <option value="America/Chicago">Central Time (CST/CDT)</option>
                  <option value="America/Denver">Mountain Time (MST/MDT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Asia/Singapore">Singapore Time (SGT)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                  <option value="Australia/Sydney">Sydney Time (AEST/AEDT)</option>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.deleteTitle}>Delete Department?</h2>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.deleteBody}>
              <AlertCircle size={32} className={styles.deleteWarningIcon} />
              <p>
                Are you sure you want to delete the department <strong>{activeDept?.name}</strong>?
              </p>
              <p className={styles.deleteSubText}>
                Any staff members or active support tickets linked to this department will be safely unassigned. This action is irreversible.
              </p>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteDepartment}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
