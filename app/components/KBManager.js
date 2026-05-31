'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Plus, FolderOpen, FileText, Eye, ThumbsUp,
  Pencil, Trash2, X, BookOpen, Loader2
} from 'lucide-react';
import styles from './KBManager.module.css';

export default function KBManager({ categories }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const isStaff = ['ADMIN', 'AGENT'].includes(session?.user?.role);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articleCategoryId, setArticleCategoryId] = useState('');
  const [articleStatus, setArticleStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Category CRUD
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setError('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setError('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const url = editingCategory
        ? `/api/kb/categories/${editingCategory.id}`
        : '/api/kb/categories';
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to save category');
      }
      setShowCategoryModal(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kb/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteConfirm(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Article CRUD
  const openCreateArticle = (categoryId) => {
    setEditingArticle(null);
    setArticleTitle('');
    setArticleBody('');
    setArticleCategoryId(categoryId || '');
    setArticleStatus('DRAFT');
    setError('');
    setShowArticleModal(true);
  };

  const openEditArticle = (article) => {
    setEditingArticle(article);
    setArticleTitle(article.title);
    setArticleBody(article.bodyHtml);
    setArticleCategoryId(article.categoryId || '');
    setArticleStatus(article.status);
    setError('');
    setShowArticleModal(true);
  };

  const handleSaveArticle = async () => {
    if (!articleTitle.trim()) { setError('Title is required'); return; }
    if (!articleBody.trim() || articleBody.trim().length < 10) {
      setError('Content must be at least 10 characters'); return;
    }
    setLoading(true);
    setError('');
    try {
      const url = editingArticle
        ? `/api/kb/articles/${editingArticle.id}`
        : '/api/kb/articles';
      const res = await fetch(url, {
        method: editingArticle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: articleTitle.trim(),
          bodyHtml: articleBody.trim(),
          categoryId: articleCategoryId || undefined,
          status: articleStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to save article');
      }
      setShowArticleModal(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kb/articles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteConfirm(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PUBLISHED': return styles.statusPublished;
      case 'DRAFT': return styles.statusDraft;
      case 'ARCHIVED': return styles.statusArchived;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>Create and manage help categories and articles for your support team.</p>
        </div>
        <div className={styles.headerActions}>
          {isStaff && (
            <button className={styles.btnSecondary} onClick={() => openCreateArticle(null)}>
              <FileText size={15} /> New Article
            </button>
          )}
          {isAdmin && (
            <button className={styles.btnPrimary} onClick={openCreateCategory}>
              <Plus size={15} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>No knowledge base categories yet</h3>
          <p>Create your first category to start organizing help articles.</p>
          {isAdmin && (
            <button className={styles.btnPrimary} onClick={openCreateCategory}>
              <Plus size={15} /> Create First Category
            </button>
          )}
        </div>
      ) : (
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <FolderOpen size={18} className={styles.categoryIcon} />
                <h2 className={styles.categoryTitle}>{cat.name}</h2>
                <span className={styles.articleCount}>{cat.articles.length} articles</span>
                {isAdmin && (
                  <div className={styles.categoryActions}>
                    <button className={styles.iconBtn} onClick={() => openEditCategory(cat)} title="Edit category">
                      <Pencil size={13} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                      title="Delete category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.articleList}>
                {cat.articles.length === 0 ? (
                  <p className={styles.emptyArticles}>No articles in this category yet.</p>
                ) : (
                  cat.articles.map((art) => (
                    <div key={art.id} className={styles.articleRow}>
                      <Link href={`/kb/${art.id}`} className={styles.articleLink}>
                        <FileText size={14} className={styles.articleIcon} />
                        <div className={styles.articleContent}>
                          <span className={styles.articleTitle}>{art.title}</span>
                          <div className={styles.articleMeta}>
                            <span className={`${styles.statusBadge} ${getStatusClass(art.status)}`}>
                              {art.status}
                            </span>
                            <span className={styles.metaItem}>
                              <Eye size={11} /> {art.views}
                            </span>
                            {art.helpfulVotes > 0 && (
                              <span className={styles.metaItem}>
                                <ThumbsUp size={11} /> {art.helpfulVotes}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      {isStaff && (
                        <div className={styles.articleActions}>
                          <button className={styles.iconBtn} onClick={() => openEditArticle(art)} title="Edit">
                            <Pencil size={12} />
                          </button>
                          {isAdmin && (
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => setDeleteConfirm({ type: 'article', id: art.id, name: art.title })}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {isStaff && (
                <button className={styles.addArticleBtn} onClick={() => openCreateArticle(cat.id)}>
                  <Plus size={14} /> Add Article
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className={styles.overlay} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button className={styles.iconBtn} onClick={() => setShowCategoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {error && <div className={styles.errorMsg}>{error}</div>}
              <label className={styles.label}>Category Name</label>
              <input
                className={styles.input}
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Getting Started, Troubleshooting..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveCategory} disabled={loading}>
                {loading ? <Loader2 size={15} className={styles.spin} /> : null}
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <div className={styles.overlay} onClick={() => setShowArticleModal(false)}>
          <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingArticle ? 'Edit Article' : 'New Article'}</h3>
              <button className={styles.iconBtn} onClick={() => setShowArticleModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {error && <div className={styles.errorMsg}>{error}</div>}

              <label className={styles.label}>Title</label>
              <input
                className={styles.input}
                type="text"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                placeholder="Article title..."
                autoFocus
              />

              <label className={styles.label}>Content (HTML)</label>
              <textarea
                className={styles.textarea}
                value={articleBody}
                onChange={(e) => setArticleBody(e.target.value)}
                placeholder="<p>Write your article content here...</p>"
                rows={12}
              />

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.select}
                    value={articleCategoryId}
                    onChange={(e) => setArticleCategoryId(e.target.value)}
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={articleStatus}
                    onChange={(e) => setArticleStatus(e.target.value)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowArticleModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveArticle} disabled={loading}>
                {loading ? <Loader2 size={15} className={styles.spin} /> : null}
                {editingArticle ? 'Save Changes' : 'Create Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Confirm Delete</h3>
              <button className={styles.iconBtn} onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteMsg}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                {deleteConfirm.type === 'category' && ' Articles in this category will be uncategorized.'}
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className={styles.btnDanger}
                onClick={() =>
                  deleteConfirm.type === 'category'
                    ? handleDeleteCategory(deleteConfirm.id)
                    : handleDeleteArticle(deleteConfirm.id)
                }
                disabled={loading}
              >
                {loading ? <Loader2 size={15} className={styles.spin} /> : <Trash2 size={15} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
