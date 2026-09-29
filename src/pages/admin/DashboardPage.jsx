import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import { money } from '@/services/settings';

function BarChart({ rows, format }) {
  if (!rows || rows.length === 0) return <p style={{ color: 'var(--light)', fontSize: 12 }}>Sin datos</p>;
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div>
      <div className="bar-chart">
        {rows.map((r, i) => (
          <div
            key={i}
            className="bar"
            style={{ height: `${Math.max((r.total / max) * 100, 3)}%` }}
            title={`${format ? format(r.total) : r.total} — ${r.date ? new Date(r.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''}`}
          />
        ))}
      </div>
      <div className="bar-legend">
        {rows.length} registros · últimos 14 días
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando dashboard…</p>;
  if (!data) return <p style={{ color: 'var(--danger)' }}>No se pudo cargar el dashboard.</p>;

  const s = data.stats;
  return (
    <div>
      <h1 className="admin-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Ventas totales</div><div className="stat-value">{money(s.totalSales)}</div></div>
        <div className="stat-card"><div className="stat-label">Pedidos</div><div className="stat-value">{s.totalOrders}</div></div>
        <div className="stat-card"><div className="stat-label">Pedidos pendientes</div><div className="stat-value">{s.pendingOrders}</div></div>
        <div className="stat-card"><div className="stat-label">Productos vendidos</div><div className="stat-value">{s.productsSold}</div></div>
        <div className="stat-card"><div className="stat-label">Clientes</div><div className="stat-value">{s.customers}</div></div>
        <div className="stat-card"><div className="stat-label">Poco stock</div><div className="stat-value">{s.lowStock}</div></div>
        <div className="stat-card"><div className="stat-label">Agotados</div><div className="stat-value">{s.outOfStock}</div></div>
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{s.totalOrders + s.pendingOrders}</div></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Ventas por día</h3>
          <BarChart rows={data.salesByDate} format={money} />
        </div>
        <div className="chart-card">
          <h3>Pedidos por día</h3>
          <BarChart rows={data.ordersByDate} />
        </div>
        <div className="chart-card">
          <h3>Nuevos clientes por día</h3>
          <BarChart rows={data.newCustomers} />
        </div>
        <div className="chart-card">
          <h3>Top productos vendidos</h3>
          {data.topProducts.length ? (
            <table className="admin-table">
              <thead><tr><th>Producto</th><th>Unidades</th></tr></thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td>{p.totalSold}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--light)', fontSize: 12 }}>Sin ventas aún</p>
          )}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 18 }}>
        <h3>Últimos pedidos</h3>
        {data.recentOrders.length ? (
          <table className="admin-table">
            <thead><tr><th>N°</th><th>Estado</th><th>Total</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                  <td><span className={'status-badge ' + o.status.toLowerCase()}>{o.status}</span></td>
                  <td>{money(o.grandTotal)}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                  <td><Link className="btn-sm" to={`/admin/orders/${o.id}`}>Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--light)', fontSize: 12 }}>Sin pedidos</p>
        )}
      </div>
    </div>
  );
}