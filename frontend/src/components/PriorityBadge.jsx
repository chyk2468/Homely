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
    <span className={`badge ${badgeClass}`}>
      <Icon size={13} />
      <span>{priority} Priority</span>
    </span>
  );
};
