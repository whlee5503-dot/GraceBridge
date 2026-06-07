import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#1a6b4a] hover:bg-[#155a3e] active:bg-[#0f4530] dark:bg-[#4ade80] dark:hover:bg-[#22c55e] dark:active:bg-[#16a34a] dark:text-[#0f1f1a] text-white shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 dark:bg-[#2a4a40] dark:hover:bg-[#3a5a50] dark:active:bg-[#1a3a30] dark:text-slate-200',
  danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 dark:hover:bg-[#2a4a40] dark:active:bg-[#1a3a30] dark:text-slate-300',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-medium transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
