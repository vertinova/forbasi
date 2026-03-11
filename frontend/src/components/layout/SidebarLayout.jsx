import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoForbasi from '../../assets/logo-forbasi.png';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function SidebarLayout({ menuItems, title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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

  const sidebarW = collapsed ? 76 : 264;
  const roleLabel = user?.role_id === 4 ? 'PB' : user?.role_id === 3 ? 'Pengda' : user?.role_id === 2 ? 'Pengcab' : 'Anggota';

  return (
    <div className="flex min-h-screen bg-[#0a0b11]">

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR SPACER ── */}
      <div className="hidden md:block flex-shrink-0 transition-all duration-300" style={{ width: sidebarW }} aria-hidden="true" />

      {/* ── SIDEBAR ── */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col
          bg-[#0f1119] border-r border-white/[0.06]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: sidebarW }}
      >
        {/* Brand */}
        <div className={`px-4 pt-5 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
              <img src={logoForbasi} alt="FORBASI" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block font-extrabold text-white text-sm leading-tight tracking-tight">FORBASI</span>
                <span className="block text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-2">
          <ul className="space-y-0.5 list-none p-0 m-0">
            {menuItems.map((item, idx) => {
              if (item.divider) {
                return (
                  <li key={`div-${idx}`} className="pt-4 pb-1.5">
                    {!collapsed && item.dividerLabel
                      ? <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 m-0">{item.dividerLabel}</p>
                      : <div className="border-t border-white/[0.06] mx-2" />}
                  </li>
                );
              }

              const isActive = item.active !== undefined
                ? item.active
                : (item.to && (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))));

              const baseClasses = `
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 no-underline relative
                ${collapsed ? 'justify-center' : ''}
              `;

              const activeClasses = isActive
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]';

              const iconClasses = `text-base flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'}`;

              const content = (
                <>
                  <span className={iconClasses}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold leading-none rounded-full bg-red-500 text-white flex-shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {isActive && !collapsed && !item.badge && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />
                  )}
                </>
              );

              return (
                <li key={item.to || item.label || idx}>
                  {item.onClick ? (
                    <button onClick={item.onClick}
                      className={`${baseClasses} ${activeClasses} w-full text-left border-none bg-transparent cursor-pointer`}
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
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={handleLogout}
            className={`
              group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium
              text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200
              border-none bg-transparent cursor-pointer
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Logout' : ''}>
            <span className="text-base flex-shrink-0 text-gray-500 group-hover:text-red-400 transition-colors">
              <i className="fas fa-sign-out-alt" />
            </span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0f1119]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                id="sidebar-toggle-btn"
                onClick={() => {
                  if (window.innerWidth < 768) setMobileOpen(v => !v);
                  else setCollapsed(v => !v);
                }}
                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 flex items-center justify-center transition-all duration-200 cursor-pointer">
                <i className={`fas ${mobileOpen ? 'fa-xmark' : collapsed ? 'fa-indent' : 'fa-outdent'} text-sm`} />
              </button>
              <div>
                <h1 className="text-base font-bold text-white m-0 tracking-tight">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden lg:block text-[11px] text-gray-500 font-medium">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>

              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.logo_path ? (
                      <img src={`${API_BASE}/uploads/${user.logo_path}`} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-bold">{(user.full_name || user.username || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 font-medium">{user.full_name || user.username}</span>
                </div>
              )}

              <button onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-[0.97]">
                <i className="fas fa-sign-out-alt text-[10px]" /> Keluar
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7 md:px-10 md:py-8 lg:px-12 bg-[#0a0b11] min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
