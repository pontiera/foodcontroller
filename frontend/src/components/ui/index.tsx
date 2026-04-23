'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

// ── StatCard ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  change?: number; // percent change
  trend?: 'up' | 'down' | 'neutral';
}
export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-orange-500', change, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        {Icon && (
          <div className={clsx('w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center', iconColor)}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {change !== undefined && (
        <div className={clsx('flex items-center gap-1 text-xs font-medium',
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
        )}>
          {trend === 'up' ? <TrendingUp size={13} /> : trend === 'down' ? <TrendingDown size={13} /> : null}
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';
const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:  'bg-green-50 text-green-700 ring-1 ring-green-200',
  red:    'bg-red-50 text-red-700 ring-1 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  gray:   'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};
export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', BADGE_STYLES[variant])}>
      {children}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: LucideIcon; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Icon size={24} className="text-slate-400" /></div>}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex items-center justify-center py-12">
      <div className={clsx('border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin', s)} />
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────
export function DataTable({ headers, children, loading }: {
  headers: string[]; children: ReactNode; loading?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={headers.length}><LoadingSpinner /></td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN_STYLES: Record<BtnVariant, string> = {
  primary:   'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  ghost:     'text-slate-600 hover:bg-slate-100',
  danger:    'bg-red-500 text-white hover:bg-red-600',
};
export function Button({ children, variant = 'primary', onClick, disabled, type = 'button', className, size = 'md' }: {
  children: ReactNode; variant?: BtnVariant; onClick?: () => void;
  disabled?: boolean; type?: 'button' | 'submit'; className?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        sz, BTN_STYLES[variant], className,
      )}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────
export function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-600">{label}</label>}
      <input
        {...props}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-colors',
          error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
          props.className,
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────
export function Select({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-600">{label}</label>}
      <select
        {...props}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white text-slate-900 outline-none transition-colors appearance-none',
          error ? 'border-red-400' : 'border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto', width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-full transition-colors"
      />
    </div>
  );
}

// ── CostBadge ─────────────────────────────────────────────
export function CostBadge({ percent, label }: { percent: number; label?: string }) {
  const variant = percent <= 30 ? 'green' : percent <= 40 ? 'yellow' : 'red';
  return <Badge variant={variant}>{label ?? `${percent.toFixed(1)}%`}</Badge>;
}
