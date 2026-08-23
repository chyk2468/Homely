import React, { useState, useEffect } from 'react';
import { Bell, Pin, Calendar, User, RefreshCw } from 'lucide-react';
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
    } catch {
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
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
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
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

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
            <h3 style={{ color: '#222222', fontSize: '15px', marginBottom: '4px' }}>No Notices Posted</h3>
            <p style={{ color: '#777777', fontSize: '13px' }}>
              There are no announcements on the notice board right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
                style={{
                  padding: '20px 24px',
                  borderRadius: '10px',
                  border: notice.is_important ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
                  borderLeft: notice.is_important ? '4px solid #F04B4F' : '1px solid #E7E7E9',
                  backgroundColor: notice.is_important ? '#FCECED' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                }}
              >
                {/* Header row */}
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
                        <span>Pinned Notice</span>
                      </span>
                    )}

                    <h2 style={{ fontSize: '16px', margin: 0, color: '#222222', fontWeight: '700' }}>
                      {notice.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#777777' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="#A0A0A0" />
                      <span>{formatDate(notice.created_at)}</span>
                    </div>
                    {notice.author && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} color="#A0A0A0" />
                        <span>By {notice.author.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    color: '#333333',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    marginTop: '6px'
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
