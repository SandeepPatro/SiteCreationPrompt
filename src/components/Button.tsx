import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Accent is reserved for primary actions; secondary/ghost actions use ink.
const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover disabled:bg-line disabled:text-muted disabled:hover:bg-line',
  secondary: 'border border-line bg-surface text-ink hover:bg-ground',
  danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700',
  ghost:
    'text-ink underline-offset-4 hover:underline disabled:opacity-50 disabled:hover:no-underline',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`rounded-control focus-visible:outline-accent inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
