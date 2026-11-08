import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, X } from 'lucide-react';
import useAuth from '@/stores/auth';
import Toast from '@/components/Toast';
import AdminIcon from '@/components/admin/AdminIcon';
import { ADMIN_SETTINGS_SECTIONS, getAdminSettingsSection } from '@/data/adminSettings';

const NAVIGATION = [
  { id: 'overview', type: 'link', label: 'Resumen', icon: 'dashboard', to: '/admin', end: true },
  {
    id: 'catalog', type: 'group', label: 'Catálogo', icon: 'catalog', children: [
      { label: 'Productos', to: '/admin/products', icon: 'package' },
      { label: 'Categorías', to: '/admin/categories', icon: 'categories' },
      { label: 'Etiquetas', to: '/admin/tags', icon: 'tags' },
      { label: 'Inventario', to: '/admin/inventory', icon: 'inventory' }
    ]
  },
  {
    id: 'sales', type: 'group', label: 'Ventas', icon: 'orders', children: [
      { label: 'Pedidos', to: '/admin/orders', icon: 'orders' },
      { label: 'Devoluciones', to: '/admin/returns', icon: 'returns' },
      { label: 'Reembolsos', to: '/admin/refunds', icon: 'refunds' }
    ]
  },
  { id: 'customers', type: 'link', label: 'Clientes', icon: 'customers', to: '/admin/users' },
  {
    id: 'marketing', type: 'group', label: 'Marketing', icon: 'growth', children: [
      { label: 'Cupones', to: '/admin/coupons', icon: 'coupons' },
      { label: 'Reseñas', to: '/admin/reviews', icon: 'reviews' }
    ]
  },
  {
    id: 'settings', type: 'group', label: 'Configuración', icon: 'settings', children: [
      { label: 'Vista general', to: '/admin/settings', end: true, icon: 'dashboard' },
      ...ADMIN_SETTINGS_SECTIONS.map((section) => ({
        label: section.shortLabel, to: `/admin/settings/${section.id}`, icon: section.icon
      }))
    ]
  },
  { id: 'audit', type: 'link', label: 'Auditoría', icon: 'audit', to: '/admin/audit-logs' }
];

function matchesRoute(path, to, exact) {
  return exact ? path === to : path === to || path.startsWith(`${to}/`);
}

function activeNavigation(path) {
  if (path === '/admin') return { label: 'Resumen', parent: 'Administración', icon: 'dashboard' };
  if (path.startsWith('/admin/settings')) {
    const section = getAdminSettingsSection(path.split('/')[3]);
    return { label: section?.label || 'Configuración', parent: 'Configuración', icon: section?.icon || 'settings' };
  }
  for (const item of NAVIGATION) {
    if (item.type === 'link' && matchesRoute(path, item.to, item.end)) return { label: item.label, parent: 'Administración', icon: item.icon };
    const child = item.children?.find((link) => matchesRoute(path, link.to, link.end));
    if (child) return { label: child.label, parent: item.label, icon: child.icon };
  }
  return { label: 'Administración', parent: 'Panel', icon: 'dashboard' };
}

export default function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem('fenmi-admin-sidebar-collapsed') === '1'; } catch { return false; }
  });
  const [openGroups, setOpenGroups] = useState(() => ({ catalog: true, sales: true, marketing: false, settings: false }));

  useEffect(() => {
    if (auth.status === 'guest' && auth.checked) navigate('/login', { replace: true });
  }, [auth.status, auth.checked, navigate]);

  useEffect(() => {
    const activeGroup = NAVIGATION.find((group) => group.children?.some((child) => matchesRoute(location.pathname, child.to, child.end)));
    if (activeGroup) setOpenGroups((prev) => (prev[activeGroup.id] ? prev : { ...prev, [activeGroup.id]: true }));
  }, [location.pathname]);

  useEffect(() => {
    try { window.localStorage.setItem('fenmi-admin-sidebar-collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  if (auth.status !== 'authenticated' || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user?.role)) {
    return <div className="admin-auth-loading">Cargando panel… <Link to="/login">Iniciar sesión</Link></div>;
  }

  const route = activeNavigation(location.pathname);
  const closeMenu = () => setMenuOpen(false);
  const logout = async () => {
    closeMenu();
    await auth.logoutLocal();
    navigate('/login', { replace: true });
  };
  const toggleGroup = (id) => {
    if (collapsed && !menuOpen) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const userLabel = auth.user?.name || auth.user?.firstName || auth.user?.email || 'Administrador';
  const initial = String(userLabel).trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}`}>
      <button className={`admin-overlay${menuOpen ? ' show' : ''}`} onClick={closeMenu} aria-label="Cerrar menú lateral" tabIndex={menuOpen ? 0 : -1} />

      <aside className={`admin-sidebar${menuOpen ? ' open' : ''}`} aria-label="Menú de administración">
        <div className="admin-sidebar-head">
          <Link to="/admin" className="admin-brand" onClick={closeMenu} aria-label="FENMI - Inicio del panel">
            <span className="admin-brand-symbol">F<span>.</span></span>
            <span className="admin-brand-copy"><strong>FENMI</strong><small>ADMIN STUDIO</small></span>
          </Link>
          <button className="admin-mobile-close" type="button" onClick={closeMenu} aria-label="Cerrar menú"><X size={20} /></button>
        </div>

        <div className="admin-sidebar-scroll">
          <div className="admin-nav-caption">ESPACIO DE TRABAJO</div>
          <nav className="admin-nav" aria-label="Navegación principal">
            {NAVIGATION.map((item) => item.type === 'link' ? (
              <NavLink
                key={item.id} to={item.to} end={item.end}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu} title={collapsed ? item.label : undefined}
              >
                <span className="admin-nav-icon"><AdminIcon name={item.icon} /></span>
                <span className="admin-nav-label">{item.label}</span>
              </NavLink>
            ) : (
              <div key={item.id} className={`admin-nav-group${item.children.some((child) => matchesRoute(location.pathname, child.to, child.end)) ? ' is-current' : ''}`}>
                <button type="button" className={`admin-nav-group-trigger${openGroups[item.id] ? ' expanded' : ''}`} onClick={() => toggleGroup(item.id)}
                  aria-expanded={Boolean(openGroups[item.id])} aria-controls={`admin-nav-group-${item.id}`} title={collapsed ? item.label : undefined}>
                  <span className="admin-nav-icon"><AdminIcon name={item.icon} /></span>
                  <span className="admin-nav-label">{item.label}</span>
                  <ChevronDown className="admin-group-chevron" size={15} />
                </button>
                <div id={`admin-nav-group-${item.id}`} className={`admin-subnav${openGroups[item.id] ? ' is-open' : ''}`} hidden={!openGroups[item.id]}>
                  {item.children.map((child) => (
                    <NavLink key={child.to} to={child.to} end={child.end} onClick={closeMenu}
                      className={({ isActive }) => `admin-subnav-link${isActive ? ' active' : ''}`}>
                      <span className="admin-subnav-dot" /><span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-store-link" onClick={closeMenu} title="Ver tienda">
            <span className="admin-nav-icon"><AdminIcon name="store" /></span><span className="admin-nav-label">Ver tienda</span><ArrowUpRight size={15} className="admin-footer-arrow" />
          </Link>
          <button type="button" className="admin-collapse-button" onClick={() => setCollapsed((prev) => !prev)} title={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className="admin-nav-label">{collapsed ? 'Expandir menú' : 'Contraer menú'}</span>
            {!collapsed && <ChevronLeft size={14} />}
          </button>
          <div className="admin-sidebar-user" title={auth.user?.email}>
            <span className="admin-avatar">{initial}</span>
            <span className="admin-user-copy"><strong>{userLabel}</strong><small>{auth.user?.email || 'Administrador'}</small></span>
          </div>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-appbar">
          <div className="admin-appbar-left">
            <button className="admin-hamburger" type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
            <div className="admin-location">
              <span className="admin-location-parent">FENMI <ChevronRight size={13} /> {route.parent}</span>
              <strong>{route.label}</strong>
            </div>
          </div>
          <div className="admin-appbar-actions">
            <Link to="/admin/products/new" className="admin-new-product"><Plus size={16} /> <span>Nuevo producto</span></Link>
            <button className="admin-logout" type="button" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="admin-main" id="admin-content">
          <div className="admin-content"><Outlet /></div>
        </main>
      </div>
      <Toast />
    </div>
  );
}
