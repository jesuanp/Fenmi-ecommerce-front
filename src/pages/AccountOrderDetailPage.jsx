import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';
import { orderApi } from '@/services/orders';
import { money } from '@/services/settings';
import { usePageTitle } from '@/hooks/usePageTitle';

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  PROCESSING: 'Preparando pedido',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
};

export default function AccountOrderDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const ui = useUI();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(false);
  usePageTitle('Detalle de pedido');

  const load = () => {
    orderApi
      .getById(id)
      .then(setOrder)
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="empty-state">
        <h3>No se pudo cargar el pedido</h3>
        <Link to="/account/orders" className="btn">Volver a mis pedidos</Link>
      </div>
    );
  }
  if (!order) return <p style={{ padding: 40, color: 'var(--mid)' }}>Cargando…</p>;

  const cancel = async () => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;
    try {
      const updated = await orderApi.cancel(order.id);
      setOrder(updated);
      ui.showToast('Pedido cancelado');
    } catch {
      ui.showToast('No se pudo cancelar el pedido');
    }
  };

  return (
    <div className="container" style={{ padding: '56px 56px 72px', maxWidth: 980 }}>
      <div className="account-head">
        <div>
          <h1 className="page-title">{order.orderNumber}</h1>
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>
            {new Date(order.createdAt).toLocaleString('es-CO')} ·{' '}
            <span className={'status-badge ' + order.status.toLowerCase()}>{STATUS_LABELS[order.status] || order.status}</span>
          </p>
        </div>
        <Link to="/account/orders" className="btn-sm">← Mis pedidos</Link>
      </div>

      <div className="detail-grid">
        <div className="admin-card detail-section">
          <h3>Envío</h3>
          <p>{order.shipping?.recipient}</p>
          <p>{order.shipping?.line1} {order.shipping?.line2 || ''}</p>
          <p>{order.shipping?.city}, {order.shipping?.state} ({order.shipping?.country})</p>
          <p>{order.shipping?.phone}</p>
          {order.shipping?.instructions && <p style={{ color: 'var(--mid)' }}>Nota: {order.shipping.instructions}</p>}
          <p>Método: {order.shipping?.method?.methodName || '—'}</p>
        </div>

        <div className="admin-card detail-section">
          <h3>Totales</h3>
          <div className="detail-items">
            <div className="detail-item"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="detail-item"><span>Descuento</span><span>{order.discountTotal > 0 ? '−' + money(order.discountTotal) : '—'}</span></div>
            <div className="detail-item"><span>Envío</span><span>{money(order.shippingTotal)}</span></div>
            <div className="detail-item"><strong>Total</strong><strong>{money(order.grandTotal)}</strong></div>
          </div>
          {order.status === 'PENDING_PAYMENT' && (
            <button className="btn outline small" style={{ marginTop: 12, color: 'var(--danger)' }} onClick={cancel}>
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      <div className="admin-card detail-section">
        <h3>Productos</h3>
        <div className="detail-items">
          {order.items.map((i) => (
            <div className="detail-item" key={i.id}>
              <span>
                {i.quantity}x {i.name}
                {(i.color || i.size) ? ` (${i.color || ''}${i.size ? '/' + i.size : ''})` : ''}
              </span>
              <span>{money(i.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="admin-card detail-section">
          <h3>Historial</h3>
          <div className="detail-items">
            {order.statusHistory.map((h, idx) => (
              <div className="detail-item" key={idx}>
                <span>{h.from || 'Inicio'} → <strong>{STATUS_LABELS[h.to] || h.to}</strong></span>
                <span>{new Date(h.createdAt).toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}