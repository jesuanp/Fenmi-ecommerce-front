import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingBag } from 'lucide-react';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import useAuth from '@/stores/auth';
import productApi from '@/services/products';

export default function Header() {
  const cart = useCart();
  const ui = useUI();
  const auth = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const accountRef = useRef(null);
  const catRef = useRef(null);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = async () => {
    await auth.logoutLocal();
    nav('/', { replace: true });
  };

  useEffect(() => {
    productApi.categories().then((cats) => setCategories(cats || []));
  }, []);

  // Cierra el dropdown al hacer clic fuera o presionar Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  // Cierra el dropdown de categorías al hacer clic fuera.
  useEffect(() => {
    if (!catOpen) return;
    const onDocClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setCatOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [catOpen]);

  const headerClass = isHome && !scrolled ? 'header transparent' : 'header';

  return (
    <header className={headerClass}>
      <div className="header-inner">
        <div className="header-left">
          <NavLink to="/" className="nav-link" end>
            Inicio
          </NavLink>
          <NavLink to="/catalog" className="nav-link">
            Catálogo
          </NavLink>
          {categories.length > 0 && (
            <div className="cat-dropdown" ref={catRef}>
              <button
                className="nav-link cat-trigger"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
              >
                Categorías <span style={{ fontSize: 10 }}>▾</span>
              </button>
              {catOpen && (
                <div className="cat-dropdown-menu">
                  {categories.map((cat) => (
                    <NavLink
                      key={cat.slug}
                      to={`/catalog?category=${cat.slug}`}
                      onClick={() => setCatOpen(false)}
                    >
                      {cat.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
          <NavLink to="/contact" className="nav-link">
            Contacto
          </NavLink>
          <NavLink to="/policies" className="nav-link">
            Políticas
          </NavLink>
        </div>
        <NavLink to="/" className="brand">
          fenmi
        </NavLink>
        <div className="header-right">
          {auth.status === 'authenticated' ? (
            <div className="account-dd" ref={accountRef}>
              <button
                className="icon-btn"
                aria-label="Mi cuenta"
                title="Mi cuenta"
                aria-haspopup="true"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <User size={18} strokeWidth={1.6} />
              </button>
              <div className={'account-dd-menu' + (accountOpen ? ' open' : '')}>
                <span className="account-dd-user">
                  {auth.user?.firstName} {auth.user?.lastName}
                </span>
                <Link to="/account/orders" onClick={() => setAccountOpen(false)}>
                  Mis pedidos
                </Link>
                <Link to="/account/wishlist" onClick={() => setAccountOpen(false)}>
                  Mis favoritos
                </Link>
                <button onClick={logout}>Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="icon-btn"
              aria-label="Iniciar sesión"
              title="Iniciar sesión"
            >
              <User size={18} strokeWidth={1.6} />
            </Link>
          )}

          <button className="icon-btn" aria-label="Abrir carrito" title="Bolsa" onClick={() => ui.openCart()}>
            <ShoppingBag size={18} strokeWidth={1.6} />
            {cart.count() > 0 && <span className="dot">{cart.count()}</span>}
          </button>
          <button className="menu-btn" aria-label="Abrir menú" onClick={() => ui.toggleMenu()}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
