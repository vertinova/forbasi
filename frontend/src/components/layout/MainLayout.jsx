/**
 * MainLayout - Consistent wrapper for all dashboard content
 * Provides unified spacing, max-width, and responsive behavior
 */

// =============================================================================
// SECTION WRAPPER - For grouping related content
// =============================================================================
export function Section({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// SECTION HEADER - Title with optional icon and subtitle
// =============================================================================
export function SectionHeader({ icon, iconColor = 'text-emerald-400', title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${iconColor.replace('text-', '')?.split('-')[0]}-500 to-${iconColor.replace('text-', '')?.split('-')[0]}-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
            <i className={`fas fa-${icon} text-white text-sm`}></i>
          </div>
        )}
        <div>
          <h2 className="m-0 text-base font-bold text-white leading-tight">{title}</h2>
          {subtitle && <p className="m-0 mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

// =============================================================================
// CARD - Modern card container with optional header
// =============================================================================
export function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`bg-[#141620] border border-white/[0.06] rounded-2xl overflow-hidden ${className}`}>
      {noPadding ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// STAT CARD - For displaying statistics with icon
// =============================================================================
export function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'emerald',
  className = '' 
}) {
  const colorMap = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/30 from-emerald-500 to-emerald-600',
    blue: 'border-blue-500/20 hover:border-blue-500/30 from-blue-500 to-blue-600',
    amber: 'border-amber-500/20 hover:border-amber-500/30 from-amber-500 to-amber-600',
    red: 'border-red-500/20 hover:border-red-500/30 from-red-500 to-red-600',
    violet: 'border-violet-500/20 hover:border-violet-500/30 from-violet-500 to-violet-600',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/30 from-cyan-500 to-cyan-600',
    indigo: 'border-indigo-500/20 hover:border-indigo-500/30 from-indigo-500 to-indigo-600',
    teal: 'border-teal-500/20 hover:border-teal-500/30 from-teal-500 to-teal-600',
  };

  const colors = colorMap[color] || colorMap.emerald;
  const [borderColors, gradientColors] = [
    colors.split(' ').slice(0, 2).join(' '),
    colors.split(' ').slice(2).join(' ')
  ];

  return (
    <div className={`group bg-[#141620] border ${borderColors} rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden hover:bg-[#191c28] ${className}`}>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientColors} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <i className={`fas fa-${icon} text-white text-sm`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-[22px] font-bold text-white leading-none tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// =============================================================================
// QUICK ACTION CARD - For action shortcuts
// =============================================================================
export function QuickActionCard({ icon, title, description, href, color = 'emerald' }) {
  const colorMap = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    violet: 'from-violet-500 to-violet-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };

  const Component = href ? 'a' : 'div';

  return (
    <Component 
      href={href}
      className="group flex flex-col gap-3 p-4 rounded-2xl bg-[#141620] border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#191c28] cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.emerald} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <i className={`fas fa-${icon} text-white text-sm`}></i>
      </div>
      <div>
        <p className="text-sm font-bold text-white m-0 leading-tight group-hover:text-emerald-400 transition-colors">{title}</p>
        {description && <p className="text-[11px] text-gray-500 m-0 mt-0.5 leading-snug">{description}</p>}
      </div>
    </Component>
  );
}

// =============================================================================
// TABLE WRAPPER - Consistent table styling
// =============================================================================
export function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="border-b border-white/[0.06]">
      <tr>
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap bg-white/[0.02] first:pl-5 last:pr-5 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-sm first:pl-5 last:pr-5 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, striped = false, index = 0 }) {
  return (
    <tr className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${striped && index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
      {children}
    </tr>
  );
}

// =============================================================================
// PAGINATION - Modern pagination component
// =============================================================================
export function Pagination({ currentPage, totalPages, totalItems, itemLabel = 'item', onPageChange }) {
  const pages = [];
  const maxVisible = 5;
  
  // Calculate which pages to show
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] flex-wrap gap-2">
      <span className="text-xs text-gray-500">
        Hal. <span className="text-gray-300 font-semibold">{currentPage}</span> / <span className="text-gray-300 font-semibold">{totalPages}</span>
        <span className="ml-1.5 text-gray-500">· {totalItems.toLocaleString()} {itemLabel}</span>
      </span>
      <div className="flex gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        >
          <i className="fas fa-chevron-left text-[10px]"></i>
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange?.(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white"
            >
              1
            </button>
            {startPage > 2 && <span className="w-8 h-8 flex items-center justify-center text-gray-500 text-xs">…</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
              page === currentPage
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="w-8 h-8 flex items-center justify-center text-gray-500 text-xs">…</span>}
            <button
              onClick={() => onPageChange?.(totalPages)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        >
          <i className="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// FILTER BAR - For search and filter controls
// =============================================================================
export function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function FilterInput({ icon, placeholder, value, onChange, className = '', disabled = false }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-white/[0.05] border rounded-xl transition-all ${
      disabled 
        ? 'border-white/[0.04] opacity-40 pointer-events-none' 
        : 'border-white/[0.08] hover:border-emerald-500/30 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20'
    } ${className}`}>
      {icon && <i className={`fas fa-${icon} text-emerald-400 text-[11px] flex-shrink-0`}></i>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="text-xs bg-transparent border-none text-gray-200 placeholder-gray-500 focus:outline-none w-full"
      />
    </div>
  );
}

export function FilterSelect({ icon, value, onChange, children, className = '', disabled = false }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-white/[0.05] border rounded-xl transition-all ${
      disabled 
        ? 'border-white/[0.04] opacity-40 pointer-events-none' 
        : 'border-white/[0.08] hover:border-emerald-500/30 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20'
    } ${className}`}>
      {icon && <i className={`fas fa-${icon} text-emerald-400 text-[11px] flex-shrink-0`}></i>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="text-xs bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-7 min-w-[100px]"
      >
        {children}
      </select>
    </div>
  );
}

export function FilterDivider() {
  return <div className="h-7 w-px bg-white/[0.06] hidden sm:block"></div>;
}

// =============================================================================
// EMPTY STATE - For when there's no data
// =============================================================================
export function EmptyState({ icon = 'inbox', message = 'Tidak ada data' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
        <i className={`fas fa-${icon} text-xl`}></i>
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

// =============================================================================
// BADGE - Modern badge component
// =============================================================================
export function Badge({ children, color = 'gray', icon, dot = false, className = '' }) {
  const colorMap = {
    gray: 'bg-white/[0.05] border-white/[0.08] text-gray-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };

  const dotColorMap = {
    gray: 'bg-gray-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    violet: 'bg-violet-400',
    cyan: 'bg-cyan-400',
    teal: 'bg-teal-400',
    indigo: 'bg-indigo-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full shadow-sm border ${colorMap[color] || colorMap.gray} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColorMap[color] || dotColorMap.gray}`}></span>}
      {icon && <i className={`fas fa-${icon} text-[9px]`}></i>}
      {children}
    </span>
  );
}

// =============================================================================
// SOLID BADGE - For highlighted states
// =============================================================================
export function SolidBadge({ children, color = 'emerald', icon, className = '' }) {
  const colorMap = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/20',
    blue: 'bg-blue-500 text-white shadow-blue-500/20',
    amber: 'bg-amber-500 text-white shadow-amber-500/20',
    red: 'bg-red-500 text-white shadow-red-500/20',
    violet: 'bg-violet-500 text-white shadow-violet-500/20',
    gray: 'bg-gray-400 text-white shadow-gray-400/20',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${colorMap[color] || colorMap.emerald} ${className}`}>
      {children}
      {icon && <i className={`fas fa-${icon} text-[8px]`}></i>}
    </span>
  );
}

// =============================================================================
// ICON BUTTON - For action buttons
// =============================================================================
export function IconButton({ icon, title, color = 'gray', onClick, href, className = '' }) {
  const colorMap = {
    gray: 'bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white',
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-md',
    blue: 'bg-blue-500 text-white shadow-blue-500/25 hover:bg-blue-600 hover:shadow-md',
    amber: 'bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600 hover:shadow-md',
    red: 'bg-red-500 text-white shadow-red-500/25 hover:bg-red-600 hover:shadow-md',
  };

  const Component = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm active:scale-[0.97] transition-all ${colorMap[color] || colorMap.gray} ${className}`}
    >
      <i className={`fas fa-${icon} text-[11px]`}></i>
    </Component>
  );
}

// =============================================================================
// AVATAR - User/item avatar with initial
// =============================================================================
export function Avatar({ name, src, color = 'emerald', size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const colorMap = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    teal: 'from-teal-500 to-teal-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
  };

  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.emerald} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md overflow-hidden ${sizeMap[size] || sizeMap.md} ${className}`}>
      {src ? <img src={src} alt={name || ''} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

// =============================================================================
// PAGE CONTAINER - Main wrapper for page content
// =============================================================================
export function PageContainer({ children, className = '' }) {
  return (
    <div className={`max-w-[1600px] mx-auto space-y-6 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// STATS GRID - For stat card rows
// =============================================================================
export function StatsGrid({ children, cols = 6, className = '' }) {
  const colsMap = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
  };

  return (
    <div className={`grid ${colsMap[cols] || colsMap[6]} gap-3 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// SECTION LABEL - Small label for grouping
// =============================================================================
export function SectionLabel({ icon, iconColor = 'emerald', children }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {icon && <i className={`fas fa-${icon} text-${iconColor}-400`}></i>}
      {children}
    </p>
  );
}

// =============================================================================
// TAB PILLS - For tab navigation
// =============================================================================
export function TabPills({ children, className = '' }) {
  return (
    <div className={`flex gap-1.5 flex-wrap ${className}`}>
      {children}
    </div>
  );
}

export function TabPill({ active, dot, dotColor = 'gray', count, onClick, children }) {
  const dotColors = {
    gray: 'bg-gray-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
  };

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
          : 'bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:border-white/[0.1] hover:bg-white/[0.06]'
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white/70' : dotColors[dotColor] || dotColors.gray}`}></span>}
      {children}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
          active ? 'bg-white/20 text-white' : 'bg-white/[0.1] text-gray-400'
        }`}>
          {count > 999 ? '999+' : count}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// DEFAULT EXPORT - Main Layout Container
// =============================================================================
export default function MainLayout({ children }) {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7 md:px-10 md:py-8 lg:px-12 bg-[#0a0b11] min-h-screen">
      <PageContainer>
        {children}
      </PageContainer>
    </main>
  );
}
