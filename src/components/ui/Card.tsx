import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const base = 'bg-white dark:bg-[#1a2e28] rounded-2xl shadow-sm border border-slate-100 dark:border-[#2a4a40] overflow-hidden';
  const interactive = onClick ? 'cursor-pointer active:scale-95 transition-transform' : '';
  return (
    <div className={`${base} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
        {title}
      </h2>
      {children}
    </div>
  );
}
