import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state" style={{ padding: '120px 24px' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800 }}>404</h1>
      <h3>Página no encontrada</h3>
      <p>La página que buscas no existe o fue movida.</p>
      <Link to="/" className="btn lime">
        Volver al inicio
      </Link>
    </div>
  );
}