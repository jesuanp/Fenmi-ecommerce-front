import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useUI from '@/stores/ui';
import useAuth from '@/stores/auth';
import productApi from '@/services/products';

export default function MobileMenu() {
  const ui = useUI();
  const auth = useAuth();
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productApi.categories().then((cats) => setCategories(cats || []));
  }, []);

  const logout = async () => {
    ui.closeMenu();
    await auth.logoutLocal();
    nav('/', { replace: true });
  };

  return (
    <>
      <div
        className={'overlay' + (ui.menuOpen ? ' show' : '')}
        onClick={() => ui.closeMenu()}
      />
      <aside className={'drawer-menu' + (ui.menuOpen ? ' open' : '')}>
        <div className="drawer-head">
          <strong>Menú</strong>
          <button className="drawer-close" onClick={() => ui.closeMenu()}>
            ✕
          </button>
        </div>
        <nav style={{ display: 'grid', gap: '18px', padding: '26px 0' }}>
          <NavLink to="/" end onClick={() => ui.closeMenu()}>
            Inicio
          </NavLink>
          <NavLink to="/catalog" onClick={() => ui.closeMenu()}>
            Catálogo
          </NavLink>
          {categories.length > 0 && (
            <>
              <details style={{ marginTop: 4 }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    listStyle: 'none'
                  }}
                >
                  Categorías
                </summary>
                <div
                  style={{
                    display: 'grid',
                    gap: 14,
                    paddingTop: 14,
                    paddingLeft: 10
                  }}
                >
                  {categories.map((cat) => (
                    <NavLink
                      key={cat.slug}
                      to={`/catalog?category=${cat.slug}`}
                      onClick={() => ui.closeMenu()}
                    >
                      {cat.name}
                    </NavLink>
                  ))}
                </div>
              </details>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            </>
          )}
          <NavLink to="/contact" onClick={() => ui.closeMenu()}>
            Contacto
          </NavLink>
          <NavLink to="/policies" onClick={() => ui.closeMenu()}>
            Políticas
          </NavLink>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          {auth.status === 'authenticated' ? (
            <>
              <NavLink to="/account/orders" onClick={() => ui.closeMenu()}>
                Mis pedidos
              </NavLink>
              <button className="menu-logout" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={() => ui.closeMenu()}>
              Iniciar sesión
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}