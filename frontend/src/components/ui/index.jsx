import Loading from './Loading';
import ErrorBoundary from './ErrorBoundary';

export { Loading, ErrorBoundary };

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'var(--primary)', trend, trendUp = true }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>
        <Icon />
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
        {trend && (
          <span className={`trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="section-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" />}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function FormField({ label, error, children, required }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

export function Table({ columns, data, emptyMessage = 'No data available', onRowClick }) {
  if (!data || data.length === 0) {
    return <div className="table-empty">{emptyMessage}</div>;
  }
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'clickable' : ''}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}