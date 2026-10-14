import React from 'react';

export const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-3 w-20 bg-slate-200 rounded"></div>
      <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
    </div>
    <div className="h-7 w-14 bg-slate-200 rounded mb-2"></div>
    <div className="h-3 w-28 bg-slate-100 rounded"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 border-b border-slate-100 px-6 flex items-center gap-4">
        <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
        <div className="h-4 w-1/6 bg-slate-200 rounded"></div>
        <div className="h-4 w-1/6 bg-slate-200 rounded"></div>
        <div className="h-4 w-1/8 bg-slate-200 rounded"></div>
        <div className="h-4 w-1/8 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);