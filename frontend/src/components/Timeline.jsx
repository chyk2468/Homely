import React from 'react';
import { Clock, User, ShieldCheck, ArrowRight, MessageSquareQuote, Wrench } from 'lucide-react';

export const Timeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ color: '#777777', fontSize: '13px', fontStyle: 'italic', padding: '12px 0' }}>
        No history records found.
      </div>
    );
  }

  // Sort chronological
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
    <div style={{ position: 'relative', paddingLeft: '20px', margin: '16px 0' }}>
      {/* Connecting Line with Drawing Animation */}
      <div
        className="timeline-line"
        style={{
          position: 'absolute',
          top: '10px',
          bottom: '10px',
          left: '6px',
          width: '2px',
          backgroundColor: '#E7E7E9'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sorted.map((item, index) => {
          const isAdmin = item.actor_role === 'admin';
          const isStaff = item.actor_role === 'staff';
          const isLatest = index === sorted.length - 1;

          return (
            <div
              key={item.id || index}
              style={{
                position: 'relative',
                animation: `itemSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.06}s both`
              }}
            >
              {/* Node Dot with Scale Animation */}
              <div
                className="timeline-node"
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '5px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: isLatest ? '#F04B4F' : '#FFFFFF',
                  border: `3px solid ${isLatest ? '#F04B4F' : '#D5D5D8'}`,
                  zIndex: 2,
                  boxShadow: isLatest ? '0 0 10px rgba(240, 75, 79, 0.3)' : 'none',
                  transition: 'background-color 0.2s, border-color 0.2s'
                }}
              />

              {/* Event Card */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: isLatest ? '#FAFAFA' : '#FFFFFF',
                  border: isLatest ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
                  borderRadius: '10px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#222222'
                      }}
                    >
                      {isAdmin ? <ShieldCheck size={14} color="#F04B4F" /> : isStaff ? <Wrench size={14} color="#F04B4F" /> : <User size={14} color="#777777" />}
                      <span>{item.actor_name}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        backgroundColor: isAdmin ? '#FCECED' : '#F3F4F6',
                        color: isAdmin ? '#F04B4F' : '#777777'
                      }}
                    >
                      {item.actor_role}
                    </span>

                    {item.action_type && (
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          backgroundColor: item.action_type === 'CREATED' ? '#EAF7F0' : (item.action_type === 'PRIORITY_CHANGED' ? '#FDF6E9' : '#FCECED'),
                          color: item.action_type === 'CREATED' ? '#15803D' : (item.action_type === 'PRIORITY_CHANGED' ? '#B45309' : '#F04B4F')
                        }}
                      >
                        {item.action_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#A0A0A0' }}>
                    <Clock size={11} />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', margin: '4px 0' }}>
                  {item.new_status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      {item.old_status && (
                        <>
                          <span style={{ color: '#777777' }}>{item.old_status}</span>
                          <ArrowRight size={12} color="#F04B4F" />
                        </>
                      )}
                      <span style={{ fontWeight: '600', color: '#222222' }}>{item.new_status}</span>
                    </div>
                  )}

                  {item.new_priority && item.old_priority && item.old_priority !== item.new_priority && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#777777' }}>
                      <span>Priority: {item.old_priority} &rarr; <strong>{item.new_priority}</strong></span>
                    </div>
                  )}
                </div>

                {/* Remarks Note */}
                {item.note && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F7F7F8',
                      borderLeft: '3px solid #F04B4F',
                      fontSize: '12px',
                      color: '#444444',
                      lineHeight: '1.4',
                      display: 'flex',
                      gap: '6px'
                    }}
                  >
                    <MessageSquareQuote size={14} color="#F04B4F" style={{ flexShrink: 0, marginTop: '2px' }} />
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
