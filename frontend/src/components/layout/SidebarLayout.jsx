import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function SidebarLayout({ menuItems, title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close mobile sidebar on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (!e.target.closest('#sidebar') && !e.target.closest('#sidebar-toggle-btn')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [mobileOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarW = collapsed ? 80 : 260;

  const roleLabel = user?.role_id === 4 ? 'PB' : user?.role_id === 3 ? 'Pengda' : user?.role_id === 2 ? 'Pengcab' : 'Anggota';

  return (
    <div className="flex min-h-screen bg-[#0f172a] font-[Poppins]">

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col
          bg-[#0f172a] border-r border-slate-800/80
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: sidebarW }}
      >
        {/* Logo / Brand */}
        <div className="px-4 pt-6 pb-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <i className="fas fa-shield-alt text-white text-sm" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block font-bold text-white text-sm leading-tight tracking-tight">FORBASI</span>
                <span className="block text-[10px] text-emerald-400/80 font-medium tracking-wider uppercase">Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        {/* User mini-card */}
        {!collapsed && user && (
          <div className="mx-3 mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 font-bold text-sm">
                  {(user.full_name || user.username || '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate m-0">{user.full_name || user.username}</p>
                <p className="text-slate-400 text-[10px] m-0">{roleLabel}{subtitle ? ` · ${subtitle}` : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-2">
          <ul className="space-y-0.5 list-none p-0 m-0">
            {menuItems.map((item, idx) => {
              if (item.divider) {
                return (
                  <li key={`div-${idx}`} className="pt-4 pb-1">
                    {!collapsed && item.dividerLabel
                      ? <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 m-0">{item.dividerLabel}</p>
                      : <div className="border-t border-slate-800/80 mx-2" />}
                  </li>
                );
              }
              const isActive = item.active !== undefined
                ? item.active
                : (item.to && (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))));

              const baseClasses = `
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 no-underline
                ${collapsed ? 'justify-center' : ''}
              `;
              const activeClasses = isActive
                ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-600/5 text-emerald-400 shadow-sm shadow-emerald-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60';

              const iconClasses = `text-base flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`;

              const content = (
                <>
                  <span className={iconClasses}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                </>
              );

              return (
                <li key={item.to || item.label || idx}>
                  {item.onClick ? (
                    <button onClick={item.onClick}
                      className={`${baseClasses} ${activeClasses} w-full text-left border-none bg-transparent cursor-pointer font-[Poppins]`}
                      title={collapsed ? item.label : ''}>
                      {content}
                    </button>
                  ) : item.href ? (
                    <a href={item.href} className={`${baseClasses} ${activeClasses}`} title={collapsed ? item.label : ''}>
                      {content}
                    </a>
                  ) : (
                    <Link to={item.to} className={`${baseClasses} ${activeClasses}`} title={collapsed ? item.label : ''}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button onClick={handleLogout}
            className={`
              group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium
              text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200
              border-none bg-transparent cursor-pointer font-[Poppins]
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Logout' : ''}>
            <span className="text-base flex-shrink-0 text-slate-500 group-hover:text-red-400 transition-colors">
              <i className="fas fa-sign-out-alt" />
            </span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarW }}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/60">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Toggle button */}
              <button
                id="sidebar-toggle-btn"
                onClick={() => {
                  // On mobile: toggle mobile menu. On desktop: toggle collapse.
                  if (window.innerWidth < 768) setMobileOpen(v => !v);
                  else setCollapsed(v => !v);
                }}
                className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <i className={`fas ${collapsed ? 'fa-indent' : 'fa-outdent'} text-sm`} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white m-0 tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-slate-400 m-0 mt-0.5">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date */}
              <span className="hidden lg:block text-xs text-slate-500">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>

              {/* User chip */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{(user.full_name || user.username || '?')[0].toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{user.full_name || user.username}</span>
                </div>
              )}

              {/* Logout btn */}
              <button onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all duration-200 cursor-pointer">
                <i className="fas fa-sign-out-alt text-[10px]" /> Keluar
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
