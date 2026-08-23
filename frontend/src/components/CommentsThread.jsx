import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, ShieldCheck, Wrench, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const CommentsThread = ({ complaintId, initialComments = [] }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await api.getComments(complaintId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    } else {
      fetchComments();
    }
  }, [complaintId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await api.postComment(complaintId, message.trim());
      setComments(prev => [...prev, newComment]);
      setMessage('');
    } catch (err) {
      alert(err.message || 'Failed to post message.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getRoleBadge = (role) => {
    const r = role ? role.toLowerCase() : 'resident';
    if (r === 'admin') {
      return (
        <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <ShieldCheck size={11} /> Admin
        </span>
      );
    }
    if (r === 'staff') {
      return (
        <span style={{ fontSize: '11px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Wrench size={11} /> Maintenance Staff
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <User size={11} /> Resident
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MessageSquare size={18} color="var(--accent-cyan)" />
        <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
          Ticket Conversation & Updates
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          ({comments.length} message{comments.length === 1 ? '' : 's'})
        </span>
      </div>

      {/* Messages List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px',
          maxHeight: '380px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(13, 21, 39, 0.5)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}
          >
            No discussion notes yet. Start a message to coordinate with maintenance staff and admins.
          </div>
        ) : (
          comments.map((c) => {
            const isMe = user?.id === c.author_id;
            return (
              <div
                key={c.id}
                style={{
                  background: isMe ? 'rgba(6, 182, 212, 0.08)' : 'rgba(13, 21, 39, 0.7)',
                  border: isMe ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                      {c.author_name}
                    </span>
                    {getRoleBadge(c.author_role)}
                    {isMe && (
                      <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: '600' }}>(You)</span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </div>

                <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {c.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <textarea
            className="textarea-field"
            rows={2}
            placeholder="Type a message or note for resident / staff / admin..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ fontSize: '13px', padding: '10px 14px' }}
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="btn btn-primary"
            style={{ padding: '12px 18px', height: '100%', flexShrink: 0 }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
