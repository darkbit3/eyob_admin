import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ADMIN_ROUTES } from '../utils/routes';
import {
  Gavel, LayoutDashboard, Package, Users, BarChart3,
  Bell, LogOut, Menu, ChevronRight, X,
  Wallet, Trophy, Settings, ShieldCheck, Search, TrendingUp
} from 'lucide-react';

export default function AdminLayout() {
  const { currentUser, setCurrentUser, paymentQueue, notifications } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  // sidebarOpen controls visibility on ALL screen sizes
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  function logout() { setCurrentUser(null); nav(ADMIN_ROUTES.LOGIN); }

  const pendingPaymentsCount = paymentQueue.filter(p => p.status === 'pending').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const links = [
    { to: ADMIN_ROUTES.DASHBOARD, icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard',         exact: true },
    { to: ADMIN_ROUTES.AUCTIONS,  icon: <Gavel className="w-4 h-4" />,           label: 'Auctions' },
    { to: ADMIN_ROUTES.PRODUCTS,  icon: <Package className="w-4 h-4" />,         label: 'Products' },
    { to: ADMIN_ROUTES.USERS,     icon: <Users className="w-4 h-4" />,           label: 'Users' },
    { to: ADMIN_ROUTES.WALLET,    icon: <Wallet className="w-4 h-4" />,          label: 'Wallet & Payments', badge: pendingPaymentsCount },
    { to: ADMIN_ROUTES.WINNERS,   icon: <Trophy className="w-4 h-4" />,          label: 'Winners Oversight' },
    { to: ADMIN_ROUTES.REPORTS,   icon: <BarChart3 className="w-4 h-4" />,       label: 'Reports' },
    { to: ADMIN_ROUTES.PROFIT,    icon: <TrendingUp className="w-4 h-4" />,      label: 'Profit & Revenue' },
    { to: ADMIN_ROUTES.SETTINGS,  icon: <Settings className="w-4 h-4" />,        label: 'Settings' },
  ];

  // Page label → permission key mapping
  const PAGE_LABEL_MAP: Record<string, string> = {
    'Auctions':         'Auctions',
    'Products':         'Products',
    'Users':            'Users Mgmt',
    'Wallet & Payments':'Wallet',
    'Winners Oversight':'Winners',
    'Reports':          'Reports',
    'Profit & Revenue': 'Profit',
    'Settings':         'Settings',
    'Dashboard':        'Dashboard',
  };

  // Load permissions from localStorage
  let savedPerms: Record<string, Record<string, boolean>> = {};
  try { savedPerms = JSON.parse(localStorage.getItem('bidlow_role_permissions') || '{}'); } catch {}

  const isAdmin = currentUser?.role === 'admin';

  // Filter links — admin sees all; others see only permitted pages
  const visibleLinks = isAdmin ? links : links.filter(l => {
    const permKey = PAGE_LABEL_MAP[l.label];
    if (!permKey) return true; // always show if no mapping
    const role = currentUser?.role ?? '';
    return savedPerms[role]?.[permKey] === true;
  });

  const isActive = (link: { to: string; exact?: boolean }) =>
    link.exact ? loc.pathname === link.to : loc.pathname.startsWith(link.to);

  // Close sidebar and navigate
  function handleNavClick() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-slate-900 border-r border-slate-800 text-slate-200
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
          overflow-hidden
        `}
      >
        {/* Sidebar Header with hamburger/close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30 shrink-0">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold tracking-tight text-sm">BidLow</span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">ADMIN</span>
              </div>
              <p className="text-slate-400 text-[11px] truncate">Transparent Auction HQ</p>
            </div>
          </div>
          {/* Close (X) button inside sidebar */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trust engine status */}
        <div className="mx-3 mt-3 p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-300">Winner Engine: Live</span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          {visibleLinks.map(l => {
            const active = isActive(l);
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                  ${active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-purple-400 transition-colors'}>
                  {l.icon}
                </span>
                <span className="flex-1 truncate">{l.label}</span>
                {l.badge && l.badge > 0 ? (
                  <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
                    {l.badge}
                  </span>
                ) : null}
                {active && <ChevronRight className="w-3.5 h-3.5 text-purple-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 w-full text-left transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60 overflow-hidden">

        {/* Top Navbar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — always visible, toggles sidebar */}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
              <span className="text-slate-500">Admin HQ</span>
              <span>/</span>
              <span className="font-semibold text-slate-100">
                {visibleLinks.find(isActive)?.label ?? 'Console'}
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search auctions, users, reference numbers..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsModal(!showNotificationsModal)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-full ring-2 ring-slate-900" />
                )}
              </button>
              {showNotificationsModal && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">Live</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className="p-3 hover:bg-slate-800/50 transition-colors">
                        <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="p-4 text-xs text-slate-500 text-center">No notifications</p>
                    )}
                  </div>
                  <div className="p-2 bg-slate-950 border-t border-slate-800 text-center">
                    <button onClick={() => setShowNotificationsModal(false)} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/50 flex-shrink-0">
                <img
                  src={currentUser?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                  alt={currentUser?.name || 'Admin'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-purple-400 font-mono">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
