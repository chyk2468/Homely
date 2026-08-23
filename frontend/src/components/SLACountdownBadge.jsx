import React from 'react';
import { Clock, AlertTriangle, Flame, CheckCircle } from 'lucide-react';

export const SLACountdownBadge = ({ complaint }) => {
  if (!complaint) return null;

  if (complaint.status === 'Resolved') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}
      >
        <CheckCircle size={11} />
        <span>Resolved</span>
      </span>
    );
  }

  const text = complaint.sla_remaining_text || (complaint.is_overdue ? 'Overdue' : 'On Schedule');
  const status = complaint.sla_status || (complaint.is_overdue ? 'overdue' : 'normal');

  let bg = 'rgba(6, 182, 212, 0.12)';
  let border = 'rgba(6, 182, 212, 0.3)';
  let color = '#38bdf8';
  let Icon = Clock;

  if (status === 'overdue' || complaint.is_overdue) {
    bg = 'rgba(244, 63, 94, 0.15)';
    border = 'rgba(244, 63, 94, 0.4)';
    color = '#fb7185';
    Icon = Flame;
  } else if (status === 'approaching') {
    bg = 'rgba(245, 158, 11, 0.15)';
    border = 'rgba(245, 158, 11, 0.35)';
    color = '#fbbf24';
    Icon = AlertTriangle;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '700',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        letterSpacing: '0.02em'
      }}
      title={`Category SLA: ${complaint.category_sla_days || 7} days`}
    >
      <Icon size={11} />
      <span>{text}</span>
    </span>
  );
};
