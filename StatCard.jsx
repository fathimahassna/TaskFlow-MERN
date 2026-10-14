import React from 'react';

export const StatCard = ({ title, value, icon: Icon, colorClass = 'text-brand-600', bgClass = 'bg-brand-50', subtext }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};