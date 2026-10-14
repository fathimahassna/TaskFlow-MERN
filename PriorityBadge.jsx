import React from 'react';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const priorityConfig = {
  'High': {
    bg: 'bg-rose-50 border-rose-200 text-rose-700',
    icon: ArrowUp,
    iconColor: 'text-rose-500',
  },
  'Medium': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: ArrowRight,
    iconColor: 'text-amber-500',
  },
  'Low': {
    bg: 'bg-slate-50 border-slate-200 text-slate-600',
    icon: ArrowDown,
    iconColor: 'text-slate-400',
  },
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig['Medium'];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg}`}
    >
      <Icon className={`w-3 h-3 ${config.iconColor}`} />
      {priority}
    </span>
  );
};