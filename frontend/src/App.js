import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './styles/global.css';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';

// Public pages
import Home       from './pages/Home';
import MenuPage   from './pages/MenuPage';
import Login      from './pages/Login';
import Register   from './pages/Register';
import DebugPage  from './pages/DebugPage';

// Client pages
import CartPage       from './pages/client/CartPage';
import CheckoutPage   from './pages/client/CheckoutPage';
import OrdersPage     from './pages/client/OrdersPage';
import OrderTrackPage from './pages/client/OrderTrackPage';
import ProfilePage    from './pages/client/ProfilePage';
import MessagingPage  from './pages/MessagingPage';

// Employee pages
import EmpDashboard from './pages/employee/EmpDashboard';
import EmpOrders    from './pages/employee/EmpOrders';
import EmpClients   from './pages/employee/EmpClients';
import EmpMenu      from './pages/employee/EmpMenu';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminMenu      from './pages/admin/AdminMenu';
import AdminActivity  from './pages/admin/AdminActivity';

// ── Guards ──────────────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// ── Client layout (navbar + footer) ─────────────────────────────────────────
function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

// ── Staff layout (sidebar) ───────────────────────────────────────────────────
function StaffLayout({ children, role }) {
  return (
    <div className="dash-layout">
      <Sidebar role={role} />
      <main className="dash-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* ── PUBLIC ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/debug"    element={<DebugPage />} />

        {/* ── CLIENT ── */}
        <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
        <Route path="/menu" element={<ClientLayout><MenuPage /></ClientLayout>} />
        <Route path="/cart" element={<ClientLayout><CartPage /></ClientLayout>} />

        <Route path="/checkout" element={
          <ProtectedRoute roles={['client']}>
            <ClientLayout><CheckoutPage /></ClientLayout>
          </ProtectedRoute>
        }/>
        <Route path="/orders" element={
          <ProtectedRoute roles={['client']}>
            <ClientLayout><OrdersPage /></ClientLayout>
          </ProtectedRoute>
        }/>
        <Route path="/orders/:id/track" element={
          <ProtectedRoute roles={['client']}>
            <ClientLayout><OrderTrackPage /></ClientLayout>
          </ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute roles={['client']}>
            <ClientLayout><ProfilePage /></ClientLayout>
          </ProtectedRoute>
        }/>
        <Route path="/messages" element={
          <ProtectedRoute roles={['client']}>
            <ClientLayout><MessagingPage /></ClientLayout>
          </ProtectedRoute>
        }/>

        {/* ── EMPLOYEE ── */}
        <Route path="/employee" element={
          <ProtectedRoute roles={['employee']}>
            <StaffLayout role="employee"><EmpDashboard /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/employee/orders" element={
          <ProtectedRoute roles={['employee']}>
            <StaffLayout role="employee"><EmpOrders /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/employee/clients" element={
          <ProtectedRoute roles={['employee']}>
            <StaffLayout role="employee"><EmpClients /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/employee/menu" element={
          <ProtectedRoute roles={['employee']}>
            <StaffLayout role="employee"><EmpMenu /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/employee/messages" element={
          <ProtectedRoute roles={['employee']}>
            <StaffLayout role="employee"><MessagingPage /></StaffLayout>
          </ProtectedRoute>
        }/>

        {/* ── ADMIN ── */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><AdminDashboard /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><AdminUsers /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/orders" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><AdminOrders /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/menu" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><AdminMenu /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/activity" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><AdminActivity /></StaffLayout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/messages" element={
          <ProtectedRoute roles={['admin']}>
            <StaffLayout role="admin"><MessagingPage /></StaffLayout>
          </ProtectedRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
