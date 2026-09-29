import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const ui = useUI();
  const [data, setData] = useState(null);

  useEffect(() => { adminApi.getUser(id).then(setData); }, [id]);

  if (!data) return <p>Cargando…</p>;
  const u = data.user;

  return (
    <div>
      <div className="admin-top">
        <h1 className="admin-title">{u.first_name} {u.last_name}</h1>
        <Link className="btn-sm" to="/admin/users">← Clientes</Link>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-label">Pedidos</div><div className="stat-value">{data.stats.orderCount}</div></div>
        <div className="stat-card"><div className="stat-label">Total comprado</div><div className="stat-value">{money(data.stats.totalSpent)}</div></div>
        <div className="stat-card"><div className="stat-label">Estado</div><div className="stat-value">{u.status}</div></div>
      </div>
      <div className="detail-grid">
        <div className="admin-card detail-section">
          <h3>Información</h3>
          <p><strong>Correo:</strong> {u.email}</p>
          <p><strong>Teléfono:</strong> {u.phone || '—'}</p>
          <p><strong>Registro:</strong> {new Date(u.created_at).toLocaleDateString('es-CO')}</p>
          <p><strong>Último acceso:</strong> {u.last_login_at ? new Date(u.last_login_at).toLocaleString('es-CO') : '—'}</p>
          <p><strong>Proveedor:</strong> {u.provider}</p>
        </div>
        <div className="admin-card detail-section">
          <h3>Pedidos recientes</h3>
          <div className="detail-items">
            {data.recentOrders.length ? data.recentOrders.map((o) => (
              <div className="detail-item" key={o.id}>
                <Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
                <span>{money(o.grandTotal)} · {o.status}</span>
              </div>
            )) : <p style={{ color: 'var(--light)' }}>Sin pedidos</p>}
          </div>
        </div>
      </div>
    </div>
  );
}