import React from 'react';

/**
 * Reusable StatusBadge component for CoursePilot's warm beige theme
 * @param {{ variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral', children: React.ReactNode, className?: string }} props
 */
export default function StatusBadge({ variant = 'neutral', children, className = '' }) {
  const styles = {
    success: 'bg-[#EEF3EE] text-[#4E6B50] border-[#C0D1C2]',
    warning: 'bg-[#FBF2E9] text-[#C87A3E] border-[#E7CCA8]',
    error: 'bg-[#FBEBE8] text-[#B94A3E] border-[#E8BDB7]',
    info: 'bg-[#EEF2EC] text-[#68745B] border-[#C5CDC0]',
    neutral: 'bg-[#EDE5D8] text-[#777064] border-[#DED5C7]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border tracking-wide transition-colors ${
        styles[variant] || styles.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
