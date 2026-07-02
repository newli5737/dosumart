import { type ReactNode } from 'react';

export function PageToolbar({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">{title}</h2>
        {description && (
          <p className="mt-1.5 flex items-center gap-2 text-sm text-[#6b7280]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f97316]" />
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-gray-200/80 bg-white p-2 shadow-sm">
      {children}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-md shadow-orange-200'
          : 'text-[#6b7280] hover:bg-orange-50 hover:text-[#f97316]'
      }`}
    >
      {children}
    </button>
  );
}

export function DataTable({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
      {title && (
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gradient-to-r from-[#fafafa] to-[#f5f5f5]">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#9ca3af] ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'orange',
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  accent?: 'orange' | 'green' | 'blue';
}) {
  const accents = {
    orange: {
      icon: 'bg-orange-50 text-[#f97316]',
      bar: 'from-[#f97316] to-[#fb923c]',
      glow: 'shadow-orange-100',
    },
    green: {
      icon: 'bg-green-50 text-[#16a34a]',
      bar: 'from-[#16a34a] to-[#22c55e]',
      glow: 'shadow-green-100',
    },
    blue: {
      icon: 'bg-blue-50 text-[#2563eb]',
      bar: 'from-[#2563eb] to-[#3b82f6]',
      glow: 'shadow-blue-100',
    },
  };

  const style = accents[accent];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-lg ${style.glow}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.bar}`} />
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-sm font-medium text-[#6b7280]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{value}</p>
          {trend && <p className="mt-1.5 text-xs text-[#9ca3af]">{trend}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.icon} transition-transform group-hover:scale-105`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function ContentCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-gray-100 px-6 py-4">
          {title && <h2 className="text-base font-semibold text-[#111827]">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-[#9ca3af]">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
