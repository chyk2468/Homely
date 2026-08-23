import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle, MessageSquare, Wrench, Sparkles, CheckCheck } from 'lucide-react';
import { api } from '../api/client';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Ignore background fetch failure
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
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

  const getIcon = (type) => {
    switch (type) {
      case 'IMPORTANT_NOTICE':
        return <AlertCircle size={15} color="#fb7185" />;
      case 'COMMENT':
        return <MessageSquare size={15} color="#38bdf8" />;
      case 'ASSIGNMENT':
        return <Wrench size={15} color="#a78bfa" />;
      case 'FEEDBACK':
        return <Sparkles size={15} color="#facc15" />;
      default:
        return <Clock size={15} color="#34d399" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#f43f5e',
              color: '#ffffff',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: '800',
              padding: '1px 5px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f172a'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            maxHeight: '440px',
            zIndex: 1000,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-medium)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(30, 41, 59, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Check size={28} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>You're all caught up!</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>No new notifications at this time.</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: notif.is_read ? 'transparent' : 'rgba(6, 182, 212, 0.08)',
                    borderLeft: notif.is_read ? '2px solid transparent' : '2px solid var(--accent-cyan)',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: notif.is_read ? '600' : '700', color: notif.is_read ? '#cbd5e1' : '#ffffff', marginBottom: '2px' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '4px' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatTime(notif.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
