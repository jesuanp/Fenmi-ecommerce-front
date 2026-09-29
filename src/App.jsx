import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '@/stores/auth';
import ErrorBoundary from '@/components/ErrorBoundary';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import ContactPage from './pages/ContactPage';
import PoliciesPage from './pages/PoliciesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Carga diferida (code splitting) para páginas pesadas / admin.
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const AccountOrdersPage = lazy(() => import('./pages/AccountOrdersPage'));
const AccountOrderDetailPage = lazy(() => import('./pages/AccountOrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsListPage'));
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const AdminTagsPage = lazy(() => import('./pages/admin/TagsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/UserDetailPage'));
const AdminInventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminAuditPage = lazy(() => import('./pages/admin/AuditPage'));

function Lazy({ children }) {
  return <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--mid)' }}>Cargando…</div>}>{children}</Suspense>;
}

// Guard: redirige si no es admin.
function RequireAdmin({ children }) {
  const auth = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (auth.checked && auth.status !== 'authenticated') nav('/login', { replace: true });
  }, [auth.status, auth.checked]);
  if (!auth.checked) return null;
  if (auth.status !== 'authenticated') return null;
  if (auth.user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

// Bootstrap global: restaura la sesión una vez antes de decidir cualquier ruta.
function SessionBootstrap() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.checked) auth.fetchMe();
  }, [auth.checked]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionBootstrap />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="search" element={<Lazy><SearchPage /></Lazy>} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<Lazy><CheckoutPage /></Lazy>} />
          <Route path="checkout/success/:orderNumber" element={<Lazy><CheckoutSuccessPage /></Lazy>} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="account/orders" element={<Lazy><AccountOrdersPage /></Lazy>} />
          <Route path="account/orders/:id" element={<Lazy><AccountOrderDetailPage /></Lazy>} />
          <Route path="account/wishlist" element={<Lazy><WishlistPage /></Lazy>} />
        </Route>

        <Route path="/admin" element={<Lazy><RequireAdmin><AdminLayout /></RequireAdmin></Lazy>}>
          <Route index element={<Lazy><AdminDashboard /></Lazy>} />
          <Route path="products" element={<Lazy><AdminProductsPage /></Lazy>} />
          <Route path="products/new" element={<Lazy><ProductFormPage /></Lazy>} />
          <Route path="products/:id/edit" element={<Lazy><ProductFormPage /></Lazy>} />
          <Route path="categories" element={<Lazy><AdminCategoriesPage /></Lazy>} />
          <Route path="tags" element={<Lazy><AdminTagsPage /></Lazy>} />
          <Route path="orders" element={<Lazy><AdminOrdersPage /></Lazy>} />
          <Route path="orders/:id" element={<Lazy><AdminOrderDetailPage /></Lazy>} />
          <Route path="users" element={<Lazy><AdminUsersPage /></Lazy>} />
          <Route path="users/:id" element={<Lazy><AdminUserDetailPage /></Lazy>} />
          <Route path="inventory" element={<Lazy><AdminInventoryPage /></Lazy>} />
          <Route path="reviews" element={<Lazy><AdminReviewsPage /></Lazy>} />
          <Route path="coupons" element={<Lazy><AdminCouponsPage /></Lazy>} />
          <Route path="settings" element={<Lazy><AdminSettingsPage /></Lazy>} />
          <Route path="audit-logs" element={<Lazy><AdminAuditPage /></Lazy>} />
        </Route>

        <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}