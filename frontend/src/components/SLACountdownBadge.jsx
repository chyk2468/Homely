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
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: '600',
          background: '#EAF7F0',
          color: '#15803D',
          border: '1px solid #C4EDD6',
          transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <CheckCircle size={11} />
        <span>Resolved</span>
      </span>
    );
  }

  const text = complaint.sla_remaining_text || (complaint.is_overdue ? 'Overdue' : 'On Schedule');
  const status = complaint.sla_status || (complaint.is_overdue ? 'overdue' : 'normal');

  let bg = '#F3F4F6';
  let border = '#E5E7EB';
  let color = '#4B5563';
  let Icon = Clock;
  let pulseClass = '';

  if (status === 'overdue' || complaint.is_overdue) {
    bg = '#FCECED';
    border = '#F9D0D2';
    color = '#F04B4F';
    Icon = Flame;
    pulseClass = 'overdue-pulse';
  } else if (status === 'approaching') {
    bg = '#FDF6E9';
    border = '#F8E3BC';
    color = '#B45309';
    Icon = AlertTriangle;
  }

  return (
    <span
      className={pulseClass}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
      title={`Category SLA: ${complaint.category_sla_days || 7} days`}
    >
      <Icon size={11} />
      <span>{text}</span>
    </span>
  );
};
