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
  CheckCircle2,
  Send
} from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';

export const NoticeManage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editingNotice, setEditingNotice] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
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
    setSuccess('');
    setSubmitting(true);

    try {
      await api.createNotice({
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant
      });
      setSuccess(
        isImportant
          ? 'Notice created and broadcast email sent to all residents!'
          : 'Notice published successfully.'
      );
      setTitle('');
      setContent('');
      setIsImportant(false);
      setShowCreateModal(false);
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to publish notice.');
    } finally {
      setSubmitting(false);
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
      setEditingNotice(null);
      setSuccess('Notice updated successfully.');
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to update notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice announcement?')) return;
    try {
      await api.deleteNotice(id);
      setSuccess('Notice deleted.');
      fetchNotices();
    } catch (err) {
      setError('Failed to delete notice.');
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
        subtitle="Publish community updates, maintenance warnings, and broadcast urgent alerts to residents"
        extraAction={
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>Post New Notice</span>
          </button>
        }
      />

      <div className="page-body">
        {success && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#34d399',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={16} />
            <div>{success}</div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#fb7185',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={16} />
            <div>{error}</div>
          </div>
        )}

        {/* Notices List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading announcements...
          </div>
        ) : notices.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Bell size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Notices Active</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Publish an announcement to notify society residents.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Post Notice</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderLeft: notice.is_important ? '4px solid #f43f5e' : '1px solid var(--border-subtle)',
                  background: notice.is_important ? 'rgba(24, 20, 36, 0.85)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {notice.is_important && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(244, 63, 94, 0.2)',
                          color: '#fb7185',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}
                      >
                        <Pin size={12} />
                        <span>Pinned Important</span>
                      </span>
                    )}

                    <h3 style={{ fontSize: '18px', margin: 0, color: '#ffffff' }}>
                      {notice.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setEditingNotice(notice)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px' }}
                      title="Edit Notice"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '6px 10px' }}
                      title="Delete Notice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                  {notice.content}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>Posted {formatDate(notice.created_at)}</span>
                  </div>
                  {notice.author && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} />
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
          maxWidth="600px"
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
                placeholder="Write the full announcement details, dates, affected blocks..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Important / Pinned Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setIsImportant(!isImportant)}
            >
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#f43f5e', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                  Mark as Important & Pin to Top
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Pins this notice at the top and sends an automatic email notification to all residents
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                <Send size={15} />
                <span>{submitting ? 'Publishing...' : 'Publish Announcement'}</span>
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
          maxWidth="600px"
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
                gap: '12px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setEditingNotice({ ...editingNotice, is_important: !editingNotice.is_important })}
            >
              <input
                type="checkbox"
                checked={editingNotice.is_important}
                onChange={(e) => setEditingNotice({ ...editingNotice, is_important: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#f43f5e', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                  Pin to Top as Important
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
