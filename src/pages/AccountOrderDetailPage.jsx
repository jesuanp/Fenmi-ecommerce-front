import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';
import { orderApi } from '@/services/orders';
import { returnsApi } from '@/services/returns';
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

const RETURNABLE = ['PAID', 'SHIPPED', 'DELIVERED'];
const RETURN_STATUS_LABELS = {
  PENDING: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada'
};

export default function AccountOrderDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const ui = useUI();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(false);
  const [existingReturn, setExistingReturn] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  usePageTitle('Detalle de pedido');

  const load = () => {
    orderApi
      .getById(id)
      .then(setOrder)
      .catch(() => setError(true));
  };

  const loadReturn = () => {
    if (auth.status !== 'authenticated') return;
    returnsApi
      .mine()
      .then((rows) => {
        const match = (rows || []).find((r) => r.orderId === Number(id));
        setExistingReturn(match || null);
      })
      .catch(() => setExistingReturn(null));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (auth.status === 'authenticated' && order) loadReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, order?.id]);

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

  const canRequestReturn =
    auth.status === 'authenticated' &&
    RETURNABLE.includes(order.status) &&
    (!existingReturn || existingReturn.status === 'REJECTED');

  const submitReturn = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      ui.showToast('Cuéntanos el motivo (mínimo 5 caracteres).');
      return;
    }
    setSubmitting(true);
    try {
      const created = await returnsApi.create({ orderId: order.id, reason: reason.trim() });
      setExistingReturn(created);
      setModalOpen(false);
      setReason('');
      ui.showToast('Solicitud enviada. Te avisaremos por correo.');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'No se pudo enviar la solicitud';
      ui.showToast(msg);
    } finally {
      setSubmitting(false);
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

      {existingReturn && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--teal, #2A6B7C)' }}>
          <h3 style={{ marginTop: 0 }}>Solicitud de devolución</h3>
          <p style={{ margin: '4px 0' }}>
            Estado:{' '}
            <span className={'status-badge ' + (existingReturn.status === 'APPROVED' ? 'paid' : existingReturn.status === 'REJECTED' ? 'cancelled' : 'pending')}>
              {RETURN_STATUS_LABELS[existingReturn.status] || existingReturn.status}
            </span>
          </p>
          <p style={{ margin: '4px 0', color: 'var(--mid)' }}>
            Motivo: {existingReturn.reason}
          </p>
          {existingReturn.adminNote && (
            <p style={{ margin: '4px 0', color: 'var(--mid)' }}>
              Respuesta del equipo: {existingReturn.adminNote}
            </p>
          )}
          <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--mid)' }}>
            Solicitud #{existingReturn.id} · {new Date(existingReturn.createdAt).toLocaleString('es-CO')}
          </p>
          {existingReturn.status === 'REJECTED' && canRequestReturn && (
            <button className="btn outline small" style={{ marginTop: 8 }} onClick={() => setModalOpen(true)}>
              Crear nueva solicitud
            </button>
          )}
        </div>
      )}

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
          {canRequestReturn && (
            <button className="btn outline small" style={{ marginTop: 12 }} onClick={() => setModalOpen(true)}>
              Solicitar devolución
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

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => !submitting && setModalOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submitReturn} style={{ maxWidth: 480 }}>
            <h3 style={{ marginTop: 0 }}>Solicitar devolución</h3>
            <p style={{ color: 'var(--mid)', fontSize: 13, marginTop: -6 }}>
              Cuéntanos por qué quieres devolver el pedido {order.orderNumber}. El equipo de FENMI revisará tu caso
              y te responderá por correo electrónico.
            </p>
            <textarea
              autoFocus
              rows={5}
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Recibí la prenda pero la talla no me queda bien…"
              style={{ width: '100%', resize: 'vertical' }}
              required
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="button"
                className="btn outline small"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn lime small" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}