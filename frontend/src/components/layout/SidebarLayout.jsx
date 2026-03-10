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

  const sidebarW = collapsed ? '80px' : '250px';

  return (
    <div className="flex min-h-screen bg-gray-50 font-[Poppins]">

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 h-full bg-white z-50 overflow-y-auto transition-all duration-300 flex flex-col`}
        style={{
          width: sidebarW,
          boxShadow: '2px 0 10px rgba(0,0,0,0.08)',
          transform: mobileOpen ? 'translateX(0)' : undefined
        }}
      >
        {/* Logo Area */}
        <div className="border-b border-gray-100 text-center py-5 px-4">
          <img src="/logo-forbasi.png" alt="FORBASI"
            className="mx-auto mb-2 object-contain"
            style={{ width: collapsed ? 40 : 60, height: collapsed ? 40 : 'auto' }}
            onError={e => e.target.style.display = 'none'} />
          {!collapsed && (
            <>
              <span className="block font-semibold text-gray-800 text-sm leading-tight">FORBASI Admin</span>
              {subtitle && <span className="block text-xs text-gray-400 mt-0.5 truncate">{subtitle}</span>}
            </>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item, idx) => {
              if (item.divider) {
                return (
                  <li key={`div-${idx}`}>
                    {!collapsed && item.dividerLabel
                      ? <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1 m-0">{item.dividerLabel}</p>
                      : <hr className="border-gray-100 my-2 mx-1" />}
                  </li>
                );
              }
              const isActive = item.active !== undefined
                ? item.active
                : (item.to && (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))));
              const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${isActive ? 'bg-green-50 text-[#0d9500]' : 'text-gray-600 hover:bg-green-50 hover:text-[#0d9500]'}`;
              return (
                <li key={item.to || item.label || idx}>
                  {item.onClick ? (
                    <button onClick={item.onClick}
                      className={cls + ' w-full text-left border-none bg-transparent cursor-pointer font-[Poppins]'}
                      title={collapsed ? item.label : ''}>
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  ) : item.href ? (
                    <a href={item.href} className={cls} title={collapsed ? item.label : ''}>
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </a>
                  ) : (
                    <Link to={item.to} className={cls} title={collapsed ? item.label : ''}>
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-100">
          <button onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors
              ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : ''}>
            <span className="text-base flex-shrink-0">
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
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between rounded-b-xl mb-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              id="sidebar-toggle-btn"
              onClick={() => setCollapsed(v => !v)}
              className="text-[#0d9500] hover:scale-110 transition-transform bg-transparent border-none cursor-pointer text-xl p-0"
            >
              <i className="fas fa-bars" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800 m-0">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 m-0 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">
                <i className="fas fa-user-circle mr-1 text-[#0d9500]" />
                {user.full_name || user.username}
              </span>
            )}
            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors border-none cursor-pointer font-[Poppins]">
              <i className="fas fa-sign-out-alt" /> Keluar
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
