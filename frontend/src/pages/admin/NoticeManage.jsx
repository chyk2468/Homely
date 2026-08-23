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
          ? 'Notice published and broadcast notification dispatched to residents!'
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
    } catch {
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
        subtitle="Publish community updates, maintenance alerts, and broadcast urgent notices"
        extraAction={
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            <span>Post New Notice</span>
          </button>
        }
      />

      <div className="page-body">
        {success && (
          <div
            style={{
              background: '#EAF7F0',
              border: '1px solid #C4EDD6',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#15803D',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} />
            <div>{success}</div>
          </div>
        )}

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
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <div>{error}</div>
          </div>
        )}

        {/* Notices List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#777777', fontSize: '13px' }}>
            Loading announcements...
          </div>
        ) : notices.length === 0 ? (
          <div
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
            {notices.map((notice) => (
              <div
                key={notice.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  border: notice.is_important ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
                  borderLeft: notice.is_important ? '4px solid #F04B4F' : '1px solid #E7E7E9',
                  backgroundColor: notice.is_important ? '#FCECED' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {notice.is_important && (
                      <span
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
                disabled={submitting}
                className="btn btn-primary"
              >
                <Send size={14} />
                <span>{submitting ? 'Publishing...' : 'Publish'}</span>
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
