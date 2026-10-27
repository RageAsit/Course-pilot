import React from 'react';

/**
 * Reusable StatusBadge component
 * @param {{ variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral', children: React.ReactNode }} props
 */
export default function StatusBadge({ variant = 'neutral', children, className = '' }) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
        styles[variant] || styles.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
