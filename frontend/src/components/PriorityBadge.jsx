import React from 'react';
import { ArrowDown, Minus, Flame } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  let badgeClass = 'badge-priority-medium';
  let Icon = Minus;

  if (priority === 'Low') {
    badgeClass = 'badge-priority-low';
    Icon = ArrowDown;
  } else if (priority === 'High') {
    badgeClass = 'badge-priority-high';
    Icon = Flame;
  }

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        transition: 'background-color 0.2s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      <Icon size={13} />
      <span>{priority} Priority</span>
    </span>
  );
};
