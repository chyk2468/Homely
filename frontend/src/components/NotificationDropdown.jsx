import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle, MessageSquare, Wrench, Sparkles, CheckCheck } from 'lucide-react';
import { api } from '../api/client';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bellWiggle, setBellWiggle] = useState(false);
  const prevCountRef = useRef(0);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      const count = data.unread_count || 0;
      if (count > prevCountRef.current && count > 0) {
        setBellWiggle(true);
        setTimeout(() => setBellWiggle(false), 700);
      }
      prevCountRef.current = count;
      setUnreadCount(count);
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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
        return <AlertCircle size={15} color="#F04B4F" />;
      case 'COMMENT':
        return <MessageSquare size={15} color="#4F46E5" />;
      case 'ASSIGNMENT':
        return <Wrench size={15} color="#F04B4F" />;
      case 'FEEDBACK':
        return <Sparkles size={15} color="#E5A83B" />;
      default:
        return <Clock size={15} color="#46B878" />;
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
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#222222'
        }}
        title="Notifications"
        aria-label="Toggle notifications"
      >
        <Bell size={17} className={bellWiggle ? 'bell-wiggle' : ''} />
        {unreadCount > 0 && (
          <span
            className="badge-pop"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#F04B4F',
              color: '#ffffff',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: '800',
              padding: '1px 5px',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: '360px',
            maxHeight: '420px',
            zIndex: 1000,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E7E7E9',
            animation: 'modalScaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            transformOrigin: 'top right'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E7E7E9',
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={15} color="#F04B4F" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '10px', background: '#FCECED', color: '#F04B4F', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
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
                  color: '#F04B4F',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontWeight: '600',
                  transition: 'opacity 0.15s'
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
              <div style={{ textAlign: 'center', padding: '24px', color: '#777777', fontSize: '12px' }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#777777' }}>
                <Check size={24} color="#46B878" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '13px', color: '#222222', fontWeight: '600' }}>All caught up!</div>
                <div style={{ fontSize: '11px', marginTop: '2px', color: '#A0A0A0' }}>No new notifications.</div>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    marginBottom: '3px',
                    cursor: 'pointer',
                    background: notif.is_read ? '#FFFFFF' : '#FCECED',
                    borderLeft: notif.is_read ? '2px solid transparent' : '2px solid #F04B4F',
                    transition: 'background 0.15s, transform 0.15s',
                    animation: `itemSlideRight 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.03}s both`
                  }}
                  onMouseEnter={(e) => {
                    if (notif.is_read) e.currentTarget.style.background = '#F7F7F8';
                  }}
                  onMouseLeave={(e) => {
                    if (notif.is_read) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: notif.is_read ? '600' : '700', color: '#222222', marginBottom: '2px' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#777777', lineHeight: '1.3', marginBottom: '3px' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '10px', color: '#A0A0A0' }}>
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
