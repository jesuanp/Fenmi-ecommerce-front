import React, { useEffect, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const closeMenu = () => setMenuOpen(false);

  const logout = async () => {
    closeMenu();
    await auth.logoutLocal();
    nav('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <div className={'admin-overlay' + (menuOpen ? ' show' : '')} onClick={closeMenu} />

      <aside className={'admin-sidebar' + (menuOpen ? ' open' : '')}>
        <Link to="/admin" className="admin-brand" onClick={closeMenu}>
          fenmi · admin
        </Link>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={(x) => (x.isActive ? 'active' : '')}
              onClick={closeMenu}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div>{auth.user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <Link to="/" style={{ color: '#888' }} onClick={closeMenu}>Ver tienda →</Link>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <button className="admin-hamburger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1h20M1 8h20M1 15h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
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
