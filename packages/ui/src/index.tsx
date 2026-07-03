import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@dosumart/utils';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-blue-700',
    secondary: 'bg-white text-[#111827] border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-[#374151] hover:bg-gray-100',
    danger: 'bg-[#DC2626] text-white hover:bg-red-700',
  };
  const sizes = { sm: 'h-10 px-3 text-sm', md: 'h-11 px-4 text-sm', lg: 'h-12 px-6 text-base' };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] font-medium transition-colors duration-200 disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-[#111827] placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]',
          className,
        )}
        {...props}
      />
    );
  },
);

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
  };
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', variants[variant])}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-[#374151]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#2563EB]" />
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-[#111827]">{title}</h1>
      {action}
    </div>
  );
}

export { AuthProvider, useAuth, AUTH_QUERY_KEY } from './AuthProvider';
export { QrPaymentPanel } from './QrPaymentPanel';
