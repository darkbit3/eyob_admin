import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ADMIN_ROUTES } from './utils/routes';

// Layout
import AdminLayout    from './layouts/AdminLayout';
import AdminLogin     from './pages/AdminLogin';

// Pages
import AdminDashboard     from './pages/AdminDashboard';
import AdminAuctions      from './pages/AdminAuctions';
import AdminProducts      from './pages/AdminProducts';
import AdminUsers         from './pages/AdminUsers';
import AdminWallet        from './pages/AdminWallet';
import AdminWinners       from './pages/AdminWinners';
import AdminReports       from './pages/AdminReports';
import AdminSettings      from './pages/AdminSettings';
import AdminProfit        from './pages/AdminProfit';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

const permissionRoutes: Array<{ route: string; permission: string }> = [
  { route: ADMIN_ROUTES.DASHBOARD, permission: 'Dashboard' },
  { route: ADMIN_ROUTES.AUCTIONS, permission: 'Auctions' },
  { route: ADMIN_ROUTES.PRODUCTS, permission: 'Products' },
  { route: ADMIN_ROUTES.USERS, permission: 'Users Mgmt' },
  { route: ADMIN_ROUTES.WALLET, permission: 'Wallet' },
  { route: ADMIN_ROUTES.WINNERS, permission: 'Winners' },
  { route: ADMIN_ROUTES.REPORTS, permission: 'Reports' },
  { route: ADMIN_ROUTES.PROFIT, permission: 'Profit' },
  { route: ADMIN_ROUTES.SETTINGS, permission: 'Settings' },
];

function PermissionRoute({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { currentUser, rolePermissions, rolePermissionsLoading, rolePermissionsLoaded } = useApp();
  if (!currentUser || currentUser.role === 'admin') return <>{children}</>;
  if (rolePermissionsLoading || !rolePermissionsLoaded) return <div className="p-8 text-center text-sm text-slate-400">Loading permissions…</div>;

  if (rolePermissions[currentUser.role]?.[permission] === true) return <>{children}</>;

  const firstAllowed = permissionRoutes.find(item => rolePermissions[currentUser.role]?.[item.permission] === true);
  return <Navigate to={firstAllowed?.route || ADMIN_ROUTES.LOGIN} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ───────────────────────────────────────────────── */}
          <Route path={ADMIN_ROUTES.LOGIN} element={<AdminLogin />} />

          {/* ── Protected ────────────────────────────────────────────── */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route path={ADMIN_ROUTES.DASHBOARD} element={<PermissionRoute permission="Dashboard"><AdminDashboard /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.AUCTIONS} element={<PermissionRoute permission="Auctions"><AdminAuctions /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.PRODUCTS} element={<PermissionRoute permission="Products"><AdminProducts /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.USERS} element={<PermissionRoute permission="Users Mgmt"><AdminUsers /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.WALLET} element={<PermissionRoute permission="Wallet"><AdminWallet /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.WINNERS} element={<PermissionRoute permission="Winners"><AdminWinners /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.REPORTS} element={<PermissionRoute permission="Reports"><AdminReports /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.SETTINGS} element={<PermissionRoute permission="Settings"><AdminSettings /></PermissionRoute>} />
            <Route path={ADMIN_ROUTES.PROFIT} element={<PermissionRoute permission="Profit"><AdminProfit /></PermissionRoute>} />
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
