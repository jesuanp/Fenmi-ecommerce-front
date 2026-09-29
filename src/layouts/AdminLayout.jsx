import React, { useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '@/stores/auth';
import Toast from '@/components/Toast';

const NAV = [
  { to: '/admin', icon: '▦', label: 'Dashboard', end: true },
  { to: '/admin/products', icon: '▤', label: 'Productos' },
  { to: '/admin/categories', icon: '☰', label: 'Categorías' },
  { to: '/admin/tags', icon: '#', label: 'Etiquetas' },
  { to: '/admin/orders', icon: '❒', label: 'Pedidos' },
  { to: '/admin/users', icon: '◎', label: 'Clientes' },
  { to: '/admin/inventory', icon: '▥', label: 'Inventario' },
  { to: '/admin/reviews', icon: '★', label: 'Reseñas' },
  { to: '/admin/coupons', icon: '♠', label: 'Cupones' },
  { to: '/admin/settings', icon: '⚙', label: 'Configuración' },
  { to: '/admin/audit-logs', icon: '≣', label: 'Auditoría' }
];

export default function AdminLayout() {
  const auth = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (auth.status === 'guest' && auth.checked) {
      nav('/login', { replace: true });
    }
  }, [auth.status, auth.checked]);

  if (auth.status !== 'authenticated' || auth.user?.role !== 'ADMIN') {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <p>Cargando panel…</p>
        <Link to="/login">Iniciar sesión</Link>
      </div>
    );
  }

  const logout = async () => {
    await auth.logoutLocal();
    nav('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          fenmi · admin
        </Link>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={(x) => (x.isActive ? 'active' : '')}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div>{auth.user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <Link to="/" style={{ color: '#888' }}>Ver tienda →</Link>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <Link to="/" className="text-link" style={{ color: 'var(--teal)' }}>
            ← Volver a la tienda
          </Link>
          <button className="btn-sm danger" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}