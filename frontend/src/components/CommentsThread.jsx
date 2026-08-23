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
        <span style={{ fontSize: '10px', background: '#FCECED', color: '#F04B4F', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <ShieldCheck size={10} /> Admin
        </span>
      );
    }
    if (r === 'staff') {
      return (
        <span style={{ fontSize: '10px', background: '#FCECED', color: '#F04B4F', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Wrench size={10} /> Staff
        </span>
      );
    }
    return (
      <span style={{ fontSize: '10px', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <User size={10} /> Resident
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <MessageSquare size={16} color="#F04B4F" />
        <h3 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>
          Discussion & Remarks
        </h3>
        <span style={{ fontSize: '12px', color: '#777777' }}>
          ({comments.length})
        </span>
      </div>

      {/* Messages List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '16px',
          maxHeight: '360px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              background: '#F7F7F8',
              borderRadius: '8px',
              border: '1px dashed #E7E7E9',
              color: '#777777',
              fontSize: '13px'
            }}
          >
            No discussion notes yet. Send a message to coordinate with maintenance staff and admins.
          </div>
        ) : (
          comments.map((c) => {
            const isMe = user?.id === c.author_id;
            return (
              <div
                key={c.id}
                style={{
                  background: isMe ? '#FCECED' : '#FFFFFF',
                  border: isMe ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>
                      {c.author_name}
                    </span>
                    {getRoleBadge(c.author_role)}
                    {isMe && (
                      <span style={{ fontSize: '10px', color: '#F04B4F', fontWeight: '600' }}>(You)</span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#A0A0A0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </div>

                <div style={{ color: '#222222', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {c.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <textarea
            className="textarea-field"
            rows={2}
            placeholder="Type a message or note..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ fontSize: '13px', padding: '9px 12px', minHeight: '60px' }}
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="btn btn-primary"
            style={{ padding: '10px 16px', height: '100%', flexShrink: 0 }}
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
