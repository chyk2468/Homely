import React from 'react';
import { Clock, User, ShieldCheck, ArrowRight, MessageSquareQuote } from 'lucide-react';

export const Timeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', padding: '16px 0' }}>
        No history records found.
      </div>
    );
  }

  // Sort chronological (oldest to newest for intuitive reading)
  const sorted = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', margin: '20px 0' }}>
      {/* Continuous vertical line */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          bottom: '12px',
          left: '7px',
          width: '2px',
          background: 'linear-gradient(to bottom, var(--accent-cyan), var(--border-medium))'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sorted.map((item, index) => {
          const isAdmin = item.actor_role === 'admin';
          const isLatest = index === sorted.length - 1;

          return (
            <div key={item.id || index} style={{ position: 'relative' }}>
              {/* Glowing Node Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: isLatest ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                  border: `3px solid ${isLatest ? '#ffffff' : 'var(--accent-cyan)'}`,
                  boxShadow: isLatest ? 'var(--glow-cyan)' : 'none',
                  zIndex: 2
                }}
              />

              {/* Event Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  background: isLatest ? 'rgba(22, 33, 58, 0.75)' : 'rgba(13, 21, 39, 0.65)',
                  borderLeft: isLatest ? '3px solid var(--accent-cyan)' : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {isAdmin ? <ShieldCheck size={15} color="var(--accent-cyan)" /> : <User size={15} color="var(--text-secondary)" />}
                      <span>{item.actor_name}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        background: isAdmin ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: isAdmin ? 'var(--accent-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      {item.actor_role}
                    </span>

                    {item.action_type && (
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          letterSpacing: '0.04em',
                          background: item.action_type === 'CREATED' ? 'rgba(16, 185, 129, 0.15)' : (item.action_type === 'PRIORITY_CHANGED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                          color: item.action_type === 'CREATED' ? '#34d399' : (item.action_type === 'PRIORITY_CHANGED' ? '#fbbf24' : '#818cf8')
                        }}
                      >
                        {item.action_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Status or Priority Change Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', margin: '6px 0' }}>
                  {item.new_status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      {item.old_status && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>{item.old_status}</span>
                          <ArrowRight size={13} color="var(--accent-cyan)" />
                        </>
                      )}
                      <span style={{ fontWeight: '600', color: '#ffffff' }}>{item.new_status}</span>
                    </div>
                  )}

                  {item.new_priority && item.old_priority && item.old_priority !== item.new_priority && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>Priority updated: {item.old_priority} &rarr; <strong>{item.new_priority}</strong></span>
                    </div>
                  )}
                </div>

                {/* Note / Remarks */}
                {item.note && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderLeft: '3px solid var(--accent-indigo)',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      display: 'flex',
                      gap: '8px'
                    }}
                  >
                    <MessageSquareQuote size={16} color="var(--accent-indigo)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>{item.note}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
