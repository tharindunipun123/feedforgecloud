export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-white text-black hover:bg-neutral-200',
    secondary: 'bg-transparent text-white border border-neutral-600 hover:border-white hover:bg-neutral-900',
    ghost: 'bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-900',
    danger: 'bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors min-h-[120px] resize-y ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-neutral-950 border border-neutral-800 rounded-xl p-6 ${hover ? 'hover:border-neutral-600 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-neutral-800 text-neutral-300',
    success: 'bg-neutral-800 text-white border border-neutral-600',
    warning: 'bg-neutral-900 text-neutral-300 border border-neutral-700',
    danger: 'bg-neutral-900 text-neutral-400 border border-neutral-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`${sizes[size]} border-2 border-neutral-700 border-t-white rounded-full animate-spin`} />
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-neutral-400 max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-neutral-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const statusMap = {
    active: 'success',
    provisioning: 'warning',
    suspended: 'danger',
    cancelled: 'danger',
    pending_payment: 'warning',
    payment_confirmed: 'success',
    unpaid: 'warning',
    paid: 'success',
    overdue: 'danger',
    draft: 'default',
    open: 'warning',
    in_progress: 'default',
    resolved: 'success',
    closed: 'default',
  };
  const label = (status || '').replace(/_/g, ' ');
  return <Badge variant={statusMap[status] || 'default'}>{label}</Badge>;
}

export { default as PromoBanner } from './PromoBanner';
