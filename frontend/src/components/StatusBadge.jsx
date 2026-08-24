import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export const StatusBadge = ({ status, isOverdue = false, showIcon = true }) => {
  let badgeClass = 'badge-open';
  let Icon = AlertCircle;

  if (status === 'In Progress') {
    badgeClass = 'badge-in-progress';
    Icon = Clock;
  } else if (status === 'Resolved') {
    badgeClass = 'badge-resolved';
    Icon = CheckCircle2;
  }

  return (
    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
      <span
        className={`badge ${badgeClass}`}
        style={{
          transition: 'background-color 0.2s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {showIcon && <Icon size={13} style={{ transition: 'transform 0.2s ease' }} />}
        <span>{status}</span>
      </span>
      {isOverdue && status !== 'Resolved' && (
        <span className="badge badge-overdue overdue-pulse">
          <AlertCircle size={13} />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
};
