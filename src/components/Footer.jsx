import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h4>FENMI</h4>
          <p className="footer-about">
            Activewear creado para acompañar movimiento, comodidad y estilo todos
            los días.
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/catalog">Catálogo</Link>
          <br />
          <Link to="/catalog?sort=new">Novedades</Link>
          <br />
          <Link to="/catalog?sort=best">Más vendidos</Link>
        </div>
        <div>
          <h4>Ayuda</h4>
          <Link to="/contact">Contacto</Link>
          <br />
          <Link to="/policies">Envíos y devoluciones</Link>
          <br />
          <Link to="/policies">Políticas</Link>
        </div>
        <div>
          <h4>Newsletter</h4>
          <p className="footer-about">Recibe novedades y descuentos.</p>
          <div className="newsletter">
            <input type="email" placeholder="Tu correo" aria-label="Correo para newsletter" />
            <button type="button" aria-label="Suscribirse">
              OK →
            </button>
          </div>
        </div>
      </div>
      <div className="copyright">© 2026 FENMI · Activewear · Colombia</div>
    </footer>
  );
}