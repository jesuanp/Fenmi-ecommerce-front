import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '@/services/orders';
import { money } from '@/services/settings';
import useCart from '@/stores/cart';

export default function MeetingReservationPage() {
  const { orderNumber } = useParams();
  const cart = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const fetchOrder = async () => {
    try { setError(''); setOrder(await orderApi.meeting(orderNumber)); }
    catch (e) { setError(e.response?.data?.error?.message || 'No se pudo recuperar la solicitud de encuentro.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchOrder(); }, [orderNumber]);
  const cancel = async () => {
    if (!order?.id || !window.confirm('¿Cancelar esta solicitud de encuentro? Los productos seguirán en tu carrito.')) return;
    setCancelling(true);
    try { await orderApi.abandon(order.id); await cart.hydrate(); await fetchOrder(); }
    catch (e) { setError(e.response?.data?.error?.message || 'No se pudo cancelar el encuentro.'); }
    finally { setCancelling(false); }
  };
  const point = order?.shipping?.method?.location;
  const isPaid = order?.paymentStatus === 'PAID';
  const cancelled = order?.status === 'CANCELLED';
  return <main className="container shipping-meeting-page">
    <span className="shipping-meeting-eyebrow">FENMI · Entrega presencial</span>
    <h1 className="page-title">{isPaid ? 'Compra pagada y entregada' : cancelled ? 'Encuentro cancelado' : 'Solicitud de encuentro recibida'}</h1>
    {loading && <p>Consultando tu solicitud…</p>}
    {error && <p role="alert" className="shipping-quote-error">{error}</p>}
    {order && <div className="shipping-meeting-panel">
      <p>Referencia <strong>{order.orderNumber}</strong></p>
      {isPaid ? <p>El vendedor confirmó la entrega del producto y el dinero recibido. Tu compra ya aparece en «Mis pedidos».</p> : cancelled ? <p>Este encuentro no se realizará. Si no pagaste, tus productos permanecen disponibles en el carrito.</p> : <p>Esta es una solicitud de entrega presencial, <strong>no una compra pagada</strong>. FENMI coordinará el encuentro contigo. No realices transferencias anticipadas.</p>}
      <div className="shipping-meeting-point"><h2>Punto elegido</h2><strong>{point?.name || 'Por confirmar'}</strong><p>{point?.address} · {point?.city}, {point?.state}</p><p>{point?.instructions}</p></div>
      <div className="shipping-meeting-point"><h2>Productos reservados</h2>{(order.items || []).map((item) => <p key={item.id}>{item.quantity} × {item.name} · {money(item.subtotal)}</p>)}<strong>Total a pagar al recibir: {money(order.grandTotal)}</strong></div>
      {!isPaid && !cancelled && <p className="shipping-muted">La reserva se mantiene hasta {order.expiresAt ? new Date(order.expiresAt).toLocaleString('es-CO') : 'su confirmación'}. Si no se concreta, puede vencerse. El pedido solo se marca pagado cuando el vendedor registra el pago recibido.</p>}
      <div className="shipping-meeting-actions"><Link className="btn lime" to="/cart">Ver carrito</Link>{isPaid && <Link className="btn outline" to="/account/orders">Mis pedidos</Link>}{!isPaid && !cancelled && <button type="button" className="btn outline" disabled={cancelling} onClick={cancel}>{cancelling ? 'Cancelando…' : 'Cancelar solicitud'}</button>}</div>
    </div>}
  </main>;
}
