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

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  return <>{children}</>;
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
            <Route path={ADMIN_ROUTES.DASHBOARD}     element={<AdminDashboard />} />
            <Route path={ADMIN_ROUTES.AUCTIONS}      element={<AdminAuctions />} />
            <Route path={ADMIN_ROUTES.PRODUCTS}      element={<AdminProducts />} />
            <Route path={ADMIN_ROUTES.USERS}         element={<AdminUsers />} />
            <Route path={ADMIN_ROUTES.WALLET}        element={<AdminWallet />} />
            <Route path={ADMIN_ROUTES.WINNERS}       element={<AdminWinners />} />
            <Route path={ADMIN_ROUTES.REPORTS}       element={<AdminReports />} />
            <Route path={ADMIN_ROUTES.SETTINGS}      element={<AdminSettings />} />
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
