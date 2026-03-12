/**
 * Modern Dashboard UI Components
 * Clean & Modern Design System for FORBASI Dashboard
 */

import { Link } from 'react-router-dom';
import CustomSelect from './CustomSelect';

// Color constants
const COLORS = {
  primary: '#10b981',
  primaryDark: '#059669',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  purple: '#8b5cf6',
  navy: '#1e293b',
  dark: '#0f172a',
};

// Status badge configurations
export const STATUS_CONFIG = {
  pending:                 { label: 'Proses Pengcab',    bg: 'bg-amber-50 border border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved_pengcab:        { label: 'Acc Pengcab',       bg: 'bg-blue-50 border border-blue-200',      text: 'text-blue-700',    dot: 'bg-blue-500'    },
  approved_pengda:         { label: 'Acc Pengda',        bg: 'bg-indigo-50 border border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  approved_pb:             { label: 'Approved PB',       bg: 'bg-emerald-50 border border-emerald-200',text: 'text-emerald-700', dot: 'bg-emerald-500' },
  kta_issued:              { label: 'KTA Terbit',        bg: 'bg-green-50 border border-green-200',    text: 'text-green-700',   dot: 'bg-green-500'   },
  rejected_pengcab:        { label: 'Tolak Pengcab',     bg: 'bg-red-50 border border-red-200',        text: 'text-red-700',     dot: 'bg-red-500'     },
  rejected_pengda:         { label: 'Tolak Pengda',      bg: 'bg-red-50 border border-red-200',        text: 'text-red-700',     dot: 'bg-red-500'     },
  rejected_pb:             { label: 'Tolak PB',          bg: 'bg-red-50 border border-red-200',        text: 'text-red-700',     dot: 'bg-red-500'     },
  rejected:                { label: 'Ditolak',           bg: 'bg-red-50 border border-red-200',        text: 'text-red-700',     dot: 'bg-red-500'     },
  resubmit_to_pengda:      { label: 'Resubmit',          bg: 'bg-amber-50 border border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  pending_pengda_resubmit: { label: 'Re-review',         bg: 'bg-amber-50 border border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
};

// Format rupiah
export const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

// Status Badge Component
export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' };
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs';
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-semibold shadow-sm ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};

// Modern Stat Card
export const StatCard = ({ icon, iconBg = 'from-emerald-500 to-emerald-600', value, label, trend, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-pointer group
      ${active 
        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-2 ring-emerald-500/50' 
        : 'bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600/50'
      }
      hover:translate-y-[-2px] hover:shadow-xl hover:shadow-emerald-500/5
    `}
  >
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg`}>
        <i className={`fas ${icon} text-white text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-sm font-medium mb-1 truncate">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'} mr-1`} />
            {Math.abs(trend)}% dari bulan lalu
          </p>
        )}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

// Balance Card
export const BalanceCard = ({ icon, label, value, description, variant = 'default' }) => {
  const variants = {
    income: { gradient: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-400/20', valueColor: 'text-emerald-400' },
    expense: { gradient: 'from-red-500 to-rose-600', iconBg: 'bg-red-400/20', valueColor: 'text-red-400' },
    total: { gradient: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-400/20', valueColor: 'text-blue-400' },
    pending: { gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-400/20', valueColor: 'text-amber-400' },
    default: { gradient: 'from-slate-500 to-slate-600', iconBg: 'bg-slate-400/20', valueColor: 'text-slate-300' },
  };
  
  const style = variants[variant] || variants.default;
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.gradient}`} />
      <div className={`w-14 h-14 rounded-xl ${style.iconBg} flex items-center justify-center mb-4`}>
        <i className={`fas ${icon} text-2xl ${style.valueColor}`} />
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${style.valueColor} mb-2`}>{value}</p>
      {description && <p className="text-slate-500 text-xs">{description}</p>}
    </div>
  );
};

// Section Card with Header
export const SectionCard = ({ title, icon, actions, children, className = '' }) => (
  <div className={`bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between flex-wrap gap-3 bg-slate-800/30">
        <h3 className="text-white font-semibold flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <i className={`fas ${icon} text-white text-sm`} />
          </span>
          {title}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

// Navigation Tab Button
export const TabButton = ({ active, icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
      ${active 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }
    `}
  >
    <i className={`fas ${icon} text-xs`} />
    <span>{label}</span>
    {badge !== undefined && (
      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {badge}
      </span>
    )}
  </button>
);

// Header Banner
export const DashboardHeader = ({ title, subtitle, icon, quickLinks = [], children }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 mb-6">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
    <div className="relative flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
          <i className={`fas ${icon} text-white text-2xl`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {quickLinks.map((link, idx) => (
          <Link
            key={idx}
            to={link.to}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all duration-200"
          >
            <i className={`fas ${link.icon} text-emerald-400`} />
            {link.label}
          </Link>
        ))}
        {children}
      </div>
    </div>
  </div>
);

// Modern Data Table
export const DataTable = ({ columns, data, loading, emptyIcon = 'fa-inbox', emptyText = 'Tidak ada data' }) => (
  <div className="overflow-x-auto">
    {loading ? (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Memuat data...</p>
      </div>
    ) : data.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <i className={`fas ${emptyIcon} text-5xl mb-4 opacity-30`} />
        <p className="text-sm">{emptyText}</p>
      </div>
    ) : (
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            {columns.map((col, idx) => (
              <th key={idx} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-700/20 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-5 py-4 text-sm text-slate-300">
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

// Filter Controls Container
export const FilterCard = ({ children, onSubmit, onReset }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className="bg-slate-800/30 rounded-xl p-5 mb-5 border border-slate-700/30">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
    {(onSubmit || onReset) && (
      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700/30">
        {onSubmit && (
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
            <i className="fas fa-search mr-2" />Terapkan Filter
          </button>
        )}
        {onReset && (
          <button type="button" onClick={onReset} className="px-5 py-2.5 bg-slate-700/50 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-all">
            <i className="fas fa-redo mr-2" />Reset
          </button>
        )}
      </div>
    )}
  </form>
);

// Form Input
export const FormInput = ({ label, type = 'text', placeholder, value, onChange, icon, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <i className={`fas ${icon} text-sm`} />
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all`}
        {...props}
      />
    </div>
  </div>
);

// Form Select
export const FormSelect = ({ label, value, onChange, options = [], placeholder = 'Pilih...', ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
    <CustomSelect
      value={value}
      onChange={v => onChange({ target: { value: v } })}
      options={options.map(opt => ({ value: opt.value, label: opt.label }))}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

// Action Button
export const ActionButton = ({ icon, variant = 'default', size = 'md', title, onClick, disabled, className = '' }) => {
  const variants = {
    view: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400',
    approve: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400',
    reject: 'bg-red-500/10 hover:bg-red-500/20 text-red-400',
    edit: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400',
    delete: 'bg-red-500/10 hover:bg-red-500/20 text-red-400',
    default: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400',
  };
  
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${sizes[size]} rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      <i className={`fas ${icon}`} />
    </button>
  );
};

// Pagination
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-700/30">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
      >
        <i className="fas fa-chevron-left mr-1" />Prev
      </button>
      <span className="px-4 py-1.5 text-sm text-slate-400">
        Halaman <span className="text-white font-medium">{currentPage}</span> dari <span className="text-white font-medium">{totalPages}</span>
      </span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
      >
        Next<i className="fas fa-chevron-right ml-1" />
      </button>
    </div>
  );
};

// Export all components
export default {
  StatusBadge,
  StatCard,
  BalanceCard,
  SectionCard,
  TabButton,
  DashboardHeader,
  DataTable,
  FilterCard,
  FormInput,
  FormSelect,
  ActionButton,
  Pagination,
  formatRupiah,
  STATUS_CONFIG,
};
