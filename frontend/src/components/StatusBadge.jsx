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
      <span className={`badge ${badgeClass}`}>
        {showIcon && <Icon size={13} />}
        <span>{status}</span>
      </span>
      {isOverdue && status !== 'Resolved' && (
        <span className="badge badge-overdue">
          <AlertCircle size={13} />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
};
