import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '@/services/orders';
import { money } from '@/services/settings';

export default function AccountMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    orderApi.meetings().then((rows) => setMeetings(rows || []))
      .catch((err) => setError(err.response?.data?.error?.message || 'No fue posible cargar tus solicitudes.'))
      .finally(() => setLoading(false));
  }, []);
  return <main className="container shipping-meeting-page">
    <h1 className="page-title">Mis encuentros</h1>
    <p className="shipping-muted">Aquí puedes revisar tus solicitudes de entrega presencial. Solo los pagos confirmados aparecen en «Mis pedidos».</p>
    {loading && <p>Cargando solicitudes…</p>}
    {error && <p role="alert" className="shipping-quote-error">{error}</p>}
    {!loading && !meetings.length && <p>No tienes solicitudes de entrega presencial. <Link to="/cart">Ver carrito</Link></p>}
    <div className="shipping-meetings-list">{meetings.map((order) => <article key={order.id} className="shipping-meeting-card">
      <strong>{order.orderNumber}</strong><span>{order.paymentStatus === 'PAID' ? 'Pagado y entregado' : order.status === 'CANCELLED' ? 'Cancelado' : 'Pendiente de encuentro y pago'}</span>
      <p>{order.shipping?.method?.location?.name || 'Punto de encuentro'} · {order.shipping?.method?.location?.city}</p>
      <b>{money(order.grandTotal)}</b>
      <Link to={`/checkout/meeting/${order.orderNumber}`} className="text-link">Ver solicitud</Link>
    </article>)}</div>
  </main>;
}
