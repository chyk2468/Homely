import React, { useState, useEffect } from 'react';
import {
  Bell,
  PlusCircle,
  Pin,
  Trash2,
  Edit2,
  Calendar,
  User,
  AlertCircle,
  Send,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';
import { SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const NoticeManage = () => {
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Edit Form State
  const [editingNotice, setEditingNotice] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch {
      setError('Failed to fetch notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.createNotice({
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant
      });
      setSubmitting(false);
      setCreateSuccess(true);
      toast.success(
        'Notice published',
        isImportant ? 'Pinned notice and broadcast notification dispatched!' : 'Notice is live on society board.'
      );

      setTimeout(() => {
        setTitle('');
        setContent('');
        setIsImportant(false);
        setShowCreateModal(false);
        setCreateSuccess(false);
        fetchNotices();
      }, 700);
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to publish notice.');
      toast.error('Publish error', err.message || 'Failed to publish notice.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingNotice) return;
    setSubmitting(true);

    try {
      await api.updateNotice(editingNotice.id, {
        title: editingNotice.title.trim(),
        content: editingNotice.content.trim(),
        is_important: editingNotice.is_important
      });
      setSubmitting(false);
      setEditSuccess(true);
      toast.success('Notice updated', 'Changes have been saved to notice board.');

      setTimeout(() => {
        setEditingNotice(null);
        setEditSuccess(false);
        fetchNotices();
      }, 700);
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to update notice.');
      toast.error('Update failed', err.message || 'Failed to update notice.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice announcement?')) return;
    try {
      await api.deleteNotice(id);
      toast.success('Notice removed', 'Announcement deleted from board.');
      fetchNotices();
    } catch {
      toast.error('Delete error', 'Failed to delete notice.');
    }
  };

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Navbar
        title="Notice Board Management"
        subtitle="Publish community updates, maintenance alerts, and broadcast urgent notices"
        extraAction={
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            <span>Post New Notice</span>
          </button>
        }
      />

      <div className="page-body">
        {error && (
          <div
            style={{
              background: '#FCECED',
              border: '1px solid #F9D0D2',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#F04B4F',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              animation: 'itemSlideUp 0.25s forwards'
            }}
          >
            <AlertCircle size={16} />
            <div>{error}</div>
          </div>
        )}

        {/* Notices List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        ) : notices.length === 0 ? (
          <div
            className="stagger-1"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center'
            }}
          >
            <Bell size={36} color="#A0A0A0" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#222222', fontSize: '15px', marginBottom: '4px' }}>No Notices Active</h3>
            <p style={{ color: '#777777', fontSize: '13px', marginBottom: '16px' }}>
              Publish an announcement to notify society residents.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>Post Notice</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notices.map((notice, idx) => (
              <div
                key={notice.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  border: notice.is_important ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
                  borderLeft: notice.is_important ? '4px solid #F04B4F' : '1px solid #E7E7E9',
                  backgroundColor: notice.is_important ? '#FCECED' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s',
                  animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {notice.is_important && (
                      <span
                        className="overdue-pulse"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: '#FFFFFF',
                          color: '#F04B4F',
                          border: '1px solid #F9D0D2',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}
                      >
                        <Pin size={10} />
                        <span>Important</span>
                      </span>
                    )}

                    <h3 style={{ fontSize: '15px', margin: 0, color: '#222222', fontWeight: '700' }}>
                      {notice.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setEditingNotice(notice)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Edit Notice"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Delete Notice"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ color: '#333333', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                  {notice.content}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#777777', borderTop: '1px solid #E7E7E9', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={11} color="#A0A0A0" />
                    <span>Posted {formatDate(notice.created_at)}</span>
                  </div>
                  {notice.author && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <User size={11} color="#A0A0A0" />
                      <span>By {notice.author.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Publish Community Notice"
          maxWidth="560px"
        >
          <form onSubmit={handleCreate}>
            <div className="input-group">
              <label className="input-label">Notice Title *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Annual Water Tank Cleaning Schedule"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Notice Content *</label>
              <textarea
                required
                className="textarea-field"
                rows={5}
                placeholder="Write the announcement details, dates, affected blocks..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Important / Pinned Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                marginBottom: '18px',
                cursor: 'pointer'
              }}
              onClick={() => setIsImportant(!isImportant)}
            >
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#F04B4F', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>
                  Mark as Important & Pin to Top
                </div>
                <div style={{ fontSize: '11px', color: '#777777' }}>
                  Pins notice to top and sends notification to all residents
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || createSuccess}
                className={`btn ${createSuccess ? 'btn-success' : 'btn-primary'}`}
              >
                {submitting ? (
                  <span className="btn-spinner" style={{ width: '13px', height: '13px' }} />
                ) : createSuccess ? (
                  <Check size={14} className="btn-checkmark-icon" />
                ) : (
                  <Send size={14} />
                )}
                <span>{submitting ? 'Publishing...' : createSuccess ? 'Published!' : 'Publish'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Notice Modal */}
      {editingNotice && (
        <Modal
          isOpen={!!editingNotice}
          onClose={() => setEditingNotice(null)}
          title="Edit Notice Announcement"
          maxWidth="560px"
        >
          <form onSubmit={handleUpdate}>
            <div className="input-group">
              <label className="input-label">Notice Title *</label>
              <input
                type="text"
                required
                className="input-field"
                value={editingNotice.title}
                onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Notice Content *</label>
              <textarea
                required
                className="textarea-field"
                rows={5}
                value={editingNotice.content}
                onChange={(e) => setEditingNotice({ ...editingNotice, content: e.target.value })}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                marginBottom: '18px',
                cursor: 'pointer'
              }}
              onClick={() => setEditingNotice({ ...editingNotice, is_important: !editingNotice.is_important })}
            >
              <input
                type="checkbox"
                checked={editingNotice.is_important}
                onChange={(e) => setEditingNotice({ ...editingNotice, is_important: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#F04B4F', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>
                  Pin to Top as Important
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || editSuccess}
                className={`btn ${editSuccess ? 'btn-success' : 'btn-primary'}`}
              >
                {submitting ? (
                  <span className="btn-spinner" style={{ width: '13px', height: '13px' }} />
                ) : editSuccess ? (
                  <Check size={14} className="btn-checkmark-icon" />
                ) : null}
                <span>{submitting ? 'Saving...' : editSuccess ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
