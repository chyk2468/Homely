import React, { useState, useEffect } from 'react';
import { Bell, Pin, Calendar, User, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Navbar } from '../components/Navbar';

export const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      setError('Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Navbar
        title="Society Notice Board"
        subtitle="Official updates, maintenance schedules, and important announcements"
        extraAction={
          <button onClick={fetchNotices} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="page-body">
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#fb7185',
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading announcements...
          </div>
        ) : notices.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <Bell size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Notices Posted</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              There are no announcements on the notice board right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="glass-panel"
                style={{
                  padding: '24px 28px',
                  position: 'relative',
                  borderLeft: notice.is_important ? '4px solid #f43f5e' : '1px solid var(--border-subtle)',
                  background: notice.is_important ? 'rgba(24, 20, 36, 0.85)' : 'var(--bg-card)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        <Pin size={12} />
                        <span>Pinned Notice</span>
                      </span>
                    )}

                    <h2 style={{ fontSize: '18px', margin: 0, color: notice.is_important ? '#ffffff' : 'var(--text-primary)' }}>
                      {notice.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{formatDate(notice.created_at)}</span>
                    </div>
                    {notice.author && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} />
                        <span>{notice.author.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: '14px',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    marginTop: '8px'
                  }}
                >
                  {notice.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
