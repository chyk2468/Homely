import React, { useState, useEffect } from 'react';
import { Bell, Pin, Calendar, User, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Navbar } from '../components/Navbar';
import { SkeletonListRow } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

export const NoticeBoard = () => {
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotices = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await api.getNotices();
      setNotices(data);
      if (isManual) {
        toast.success('Notice board updated', 'Retrieved latest announcements.');
      }
    } catch {
      setError('Failed to load notices.');
      if (isManual) toast.error('Refresh error', 'Failed to retrieve notices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          <button
            onClick={() => fetchNotices(true)}
            className="btn btn-secondary btn-sm"
            disabled={loading || refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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
              fontSize: '13px',
              animation: 'itemSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SkeletonListRow />
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
            <h3 style={{ color: '#222222', fontSize: '15px', marginBottom: '4px' }}>No Notices Posted</h3>
            <p style={{ color: '#777777', fontSize: '13px' }}>
              There are no announcements on the notice board right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notices.map((notice, idx) => (
              <div
                key={notice.id}
                style={{
                  padding: '20px 24px',
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
                {/* Header row */}
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
