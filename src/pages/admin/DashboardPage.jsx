import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, RefreshCw, Plus } from 'lucide-react';
import AdminIcon from '@/components/admin/AdminIcon';
import { adminApi } from '@/services/admin';
import { money } from '@/services/settings';
import { orderStatusLabel } from '@/utils/orderDisplay';

function BarChart({ rows, format }) {
  if (!rows?.length) return (
    <div className="admin-chart-empty"><AdminIcon name="chart" size={24} /><span>Aún no hay datos para mostrar</span></div>
  );
  const max = Math.max(...rows.map((row) => Number(row.total) || 0), 1);
  return (
    <div className="admin-bars-container">
      <div className="bar-chart" role="img" aria-label="Gráfico de barras de los últimos 14 días">
        {rows.map((row, idx) => (
          <div key={`${row.date || idx}-${idx}`} className="admin-bar-column">
            <div className="bar" style={{ height: `${Math.max((Number(row.total) / max) * 100, 3)}%` }}
              title={`${format ? format(row.total) : row.total}${row.date ? ` · ${new Date(row.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}` : ''}`} />
          </div>
        ))}
      </div>
      <div className="bar-legend">Últimos 14 días · {rows.length} registros</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.dashboard();
      setData(result);
    } catch {
      setData(null);
      setError('No se pudieron cargar las estadísticas. Comprueba la conexión o vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <div className="admin-loading-state"><span className="admin-loading-indicator" />Cargando el resumen de tu tienda…</div>;
  if (!data) return (
    <div role="alert" className="admin-empty-state">
      <AdminIcon name="warning" size={28} />
      <h1 className="admin-title">No se pudo cargar el resumen</h1>
      <p>{error}</p>
      <button type="button" className="admin-button primary" onClick={loadDashboard}><RefreshCw size={16} /> Reintentar</button>
    </div>
  );

  const stats = data.stats || {};
  const cards = [
    { label: 'Ventas totales', value: money(stats.totalSales || 0), icon: 'growth', hint: 'Ingresos registrados', to: '/admin/orders', tone: 'mint' },
    { label: 'Pedidos creados', value: stats.totalOrders ?? 0, icon: 'orders', hint: 'Órdenes de la tienda', to: '/admin/orders', tone: 'blue' },
    { label: 'Por atender', value: stats.pendingOrders ?? 0, icon: 'pending', hint: 'Pedidos pendientes', to: '/admin/orders', tone: 'amber' },
    { label: 'Unidades vendidas', value: stats.productsSold ?? 0, icon: 'package', hint: 'Productos vendidos', to: '/admin/products', tone: 'violet' },
    { label: 'Clientes', value: stats.customers ?? 0, icon: 'customers', hint: 'Cuentas registradas', to: '/admin/users', tone: 'blue' },
    { label: 'Poco stock', value: stats.lowStock ?? 0, icon: 'inventory', hint: 'Revisar existencias', to: '/admin/inventory', tone: 'amber' },
    { label: 'Agotados', value: stats.outOfStock ?? 0, icon: 'warning', hint: 'Sin unidades disponibles', to: '/admin/inventory', tone: 'rose' },
    { label: 'Pedidos pagados', value: stats.paidOrders ?? 0, icon: 'badge-check', hint: 'Pagos confirmados', to: '/admin/orders', tone: 'mint' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome-banner">
        <div>
          <div className="admin-welcome-kicker"><span /> CENTRO DE OPERACIONES</div>
          <h1>Todo tu negocio, en un solo lugar.</h1>
          <p>Revisa las ventas, administra tus pedidos y mantén el catálogo al día.</p>
          <div className="admin-welcome-actions">
            <Link to="/admin/orders" className="admin-button primary">Ver pedidos <ArrowRight size={17} /></Link>
            <Link to="/admin/products/new" className="admin-button light"><Plus size={17} /> Agregar producto</Link>
          </div>
        </div>
        <div className="admin-welcome-visual" aria-hidden="true"><span className="admin-welcome-orbit" /><AdminIcon name="chart" size={44} /></div>
      </div>

      <div className="admin-section-heading">
        <div><div className="admin-eyebrow">MÉTRICAS PRINCIPALES</div><h2>Resumen de la tienda</h2><p>Los indicadores reflejan la información registrada en el sistema.</p></div>
        <button type="button" className="admin-button subtle" onClick={loadDashboard}><RefreshCw size={15} /> Actualizar</button>
      </div>

      <div className="stats-grid">
        {cards.map((item) => (
          <Link to={item.to} key={item.label} className="stat-card">
            <div className="admin-stat-top"><span className={`admin-stat-icon tone-${item.tone}`}><AdminIcon name={item.icon} size={21} /></span><ArrowUpRight className="admin-stat-arrow" size={17} /></div>
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">{item.value}</div>
            <div className="admin-stat-hint">{item.hint}</div>
          </Link>
        ))}
      </div>

      <div className="admin-section-heading admin-section-heading-charts">
        <div><div className="admin-eyebrow">ACTIVIDAD</div><h2>Movimiento de la tienda</h2></div>
      </div>
      <div className="charts-grid">
        <section className="chart-card"><div className="admin-card-heading"><span className="admin-card-title-icon tone-mint"><AdminIcon name="growth" size={18} /></span><div><h3>Ventas por día</h3><p>Evolución de ingresos</p></div></div><BarChart rows={data.salesByDate} format={money} /></section>
        <section className="chart-card"><div className="admin-card-heading"><span className="admin-card-title-icon tone-blue"><AdminIcon name="orders" size={18} /></span><div><h3>Pedidos por día</h3><p>Volumen de compras</p></div></div><BarChart rows={data.ordersByDate} /></section>
        <section className="chart-card"><div className="admin-card-heading"><span className="admin-card-title-icon tone-violet"><AdminIcon name="customers" size={18} /></span><div><h3>Nuevos clientes</h3><p>Registros recientes</p></div></div><BarChart rows={data.newCustomers} /></section>
        <section className="chart-card"><div className="admin-card-heading"><span className="admin-card-title-icon tone-amber"><AdminIcon name="package" size={18} /></span><div><h3>Productos destacados</h3><p>Más vendidos</p></div></div>
          {data.topProducts?.length ? (
            <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Producto</th><th>Unidades</th></tr></thead><tbody>
              {data.topProducts.map((product, idx) => <tr key={`${product.name}-${idx}`}><td>{product.name}</td><td><strong>{product.totalSold}</strong></td></tr>)}
            </tbody></table></div>
          ) : <div className="admin-chart-empty"><AdminIcon name="package" size={24} />Sin ventas todavía</div>}
        </section>
      </div>

      <section className="admin-card admin-dashboard-orders">
        <div className="admin-table-title"><div><div className="admin-eyebrow">ACTIVIDAD RECIENTE</div><h2>Últimos pedidos</h2><p>Consulta el estado de las compras más recientes.</p></div><Link to="/admin/orders" className="admin-button subtle">Ver todos <ArrowRight size={16} /></Link></div>
        {data.recentOrders?.length ? (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>N.º de pedido</th><th>Estado</th><th>Total</th><th>Fecha</th><th></th></tr></thead><tbody>
            {data.recentOrders.map((order) => <tr key={order.id}>
              <td><Link to={`/admin/orders/${order.id}`} className="admin-table-link">{order.orderNumber}</Link></td>
              <td><span className={`status-badge ${order.status.toLowerCase()}`}>{orderStatusLabel(order.status)}</span></td>
              <td><strong>{money(order.grandTotal)}</strong></td>
              <td>{new Date(order.createdAt).toLocaleDateString('es-CO')}</td>
              <td><Link className="btn-sm" to={`/admin/orders/${order.id}`}>Ver detalle <ArrowUpRight size={13} /></Link></td>
            </tr>)}
          </tbody></table></div>
        ) : <div className="admin-chart-empty"><AdminIcon name="orders" size={24} />Aún no hay pedidos registrados</div>}
      </section>
    </div>
  );
}
