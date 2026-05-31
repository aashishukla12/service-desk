'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Users,
  Building,
  UserCheck,
  UserX,
  X,
  Loader2,
  Edit2,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import styles from './AgentManagement.module.css';

export default function AgentManagementView({
  initialUsers,
  departments,
  currentUser,
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Add form fields
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'AGENT',
    departmentId: '',
  });

  // Edit form fields
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'AGENT',
    departmentId: '',
    isActive: true,
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // 2. Role
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }
      // 3. Status
      if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        if (u.isActive !== isActive) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleOpenEdit = (user) => {
    if (!isAdmin) return;
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      departmentId: user.departmentId || '',
      isActive: user.isActive,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          role: addForm.role,
          departmentId: addForm.departmentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setUsers((prev) => [data.user, ...prev]);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        role: 'AGENT',
        departmentId: '',
      });
      router.refresh();
    } catch (err) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          role: editForm.role,
          departmentId: editForm.departmentId || null,
          isActive: editForm.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...data.user } : u))
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
      router.refresh();
    } catch (err) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Agent Management</h1>
          <p className={styles.subtitle}>
            View and manage support staff, roles, and department assignments.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className={styles.createBtn}
          >
            <Plus size={16} />
            Add Agent
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search agents by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.selectGroup}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="AGENT">Agent</option>
            <option value="LIGHT_AGENT">Light Agent</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <Users size={48} className={styles.emptyIcon} />
                      <h3>No Agents Found</h3>
                      <p>
                        Try adjusting your filters or add a new agent to your
                        organization.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleLabel =
                    user.role === 'ADMIN'
                      ? 'Admin'
                      : user.role === 'LIGHT_AGENT'
                      ? 'Light Agent'
                      : 'Agent';

                  return (
                    <tr
                      key={user.id}
                      className={isAdmin ? styles.clickableRow : ''}
                      onClick={() => isAdmin && handleOpenEdit(user)}
                    >
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${
                            styles[`role${user.role}`]
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td>
                        {user.department ? (
                          <div className={styles.deptCell}>
                            <Building size={14} className={styles.deptIcon} />
                            <span>{user.department.name}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>None</span>
                        )}
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                            <UserCheck size={12} />
                            Active
                          </span>
                        ) : (
                          <span className={`${styles.statusBadge} ${styles.statusInactive}`}>
                            <UserX size={12} />
                            Inactive
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(user);
                            }}
                            title="Edit Agent"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Agent</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className={styles.form}>
              {formError && <div className={styles.errorAlert}>{formError}</div>}

              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@acme.com"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                    <option value="LIGHT_AGENT">Light Agent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Department</label>
                  <select
                    value={addForm.departmentId}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, departmentId: e.target.value }))
                    }
                  >
                    <option value="">None (Unassigned)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.btnSecondary}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      Adding...
                    </>
                  ) : (
                    'Add Agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Agent — {selectedUser.name}</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className={styles.form}>
              {formError && <div className={styles.errorAlert}>{formError}</div>}

              <div className={styles.formGroup}>
                <label>Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                    <option value="LIGHT_AGENT">Light Agent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Department</label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        departmentId: e.target.value,
                      }))
                    }
                  >
                    <option value="">None (Unassigned)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroupCheckbox}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  <span>Active Agent (Allow signing in and ticket assignments)</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.btnSecondary}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
