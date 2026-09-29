import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

const NEXT = {
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED']
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const ui = useUI();
  const [order, setOrder] = useState(null);

  useEffect(() => { adminApi.getOrder(id).then(setOrder); }, [id]);

  const change = async (toStatus) => {
    if (!window.confirm(`¿Cambiar a "${toStatus}"?`)) return;
    try {
      const updated = await adminApi.changeOrderStatus(id, toStatus);
      setOrder(updated);
      ui.showToast('Estado actualizado');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'Error');
    }
  };

  const approve = async (paymentId) => {
    if (!window.confirm('¿Aprobar este comprobante de pago?')) return;
    try {
      await adminApi.approveOrderPayment(paymentId);
      const updated = await adminApi.getOrder(id);
      setOrder(updated);
      ui.showToast('Pago aprobado');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'Error al aprobar');
    }
  };

  const reject = async (paymentId) => {
    const reason = window.prompt('Motivo del rechazo (mínimo 5 caracteres):');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) ui.showToast('El motivo debe tener al menos 5 caracteres');
      return;
    }
    try {
      await adminApi.rejectOrderPayment(paymentId, reason.trim());
      const updated = await adminApi.getOrder(id);
      setOrder(updated);
      ui.showToast('Comprobante rechazado');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'Error al rechazar');
    }
  };

  if (!order) return <p>Cargando…</p>;

  const pendingPayment = (order.payments || []).find((p) => p.proofUrl && p.status !== 'APPROVED');

  return (
    <div>
      <div className="admin-top">
        <h1 className="admin-title">{order.orderNumber}</h1>
        <Link className="btn-sm" to="/admin/orders">← Pedidos</Link>
      </div>

      <div className="detail-grid">
        <div className="admin-card detail-section">
          <h3>Estado</h3>
          <p>Estado: <span className={'status-badge ' + order.status.toLowerCase()}>{order.status.replace('_', ' ')}</span></p>
          <p>Pago: <span className={'status-badge ' + (order.paymentStatus === 'PAID' ? 'paid' : 'pending')}>{order.paymentStatus}</span></p>
          {NEXT[order.status] && (
            <div className="admin-actions" style={{ marginTop: 12 }}>
              {NEXT[order.status].map((s) => (
                <button key={s} className="btn-sm" onClick={() => change(s)}>Marcar {s.replace('_', ' ')}</button>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card detail-section">
          <h3>Cliente</h3>
          <p><strong>{order.customer?.firstName} {order.customer?.lastName}</strong></p>
          <p>{order.customer?.email}</p>
          <p>{order.customer?.phone}</p>
        </div>

        <div className="admin-card detail-section">
          <h3>Envío</h3>
          <p>{order.shipping?.recipient}</p>
          <p>{order.shipping?.line1} {order.shipping?.line2 || ''}</p>
          <p>{order.shipping?.city}, {order.shipping?.state}</p>
          <p>{order.shipping?.phone}</p>
          <p>Método: {order.shipping?.method?.methodName} · {money(order.shippingTotal)}</p>
        </div>

        <div className="admin-card detail-section">
          <h3>Totales</h3>
          <div className="detail-items">
            <div className="detail-item"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="detail-item"><span>Envío</span><span>{money(order.shippingTotal)}</span></div>
            <div className="detail-item"><span>Descuento</span><span>{money(order.discountTotal)}</span></div>
            <div className="detail-item"><strong>Total</strong><strong>{money(order.grandTotal)}</strong></div>
          </div>
        </div>
      </div>

      {(order.payments || []).length > 0 && (
        <div className="admin-card detail-section">
          <h3>Comprobante de pago</h3>
          {(order.payments || []).map((p) => (
            <div key={p.id} style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <p style={{ fontSize: 13, color: 'var(--mid)' }}>
                    <strong>Banco:</strong> {p.bank || '—'} ·{' '}
                    <strong>Estado:</strong>{' '}
                    <span className={'status-badge ' + (p.status === 'APPROVED' ? 'paid' : (p.status === 'PENDING' ? 'pending' : 'cancelled'))}>
                      {p.status}
                    </span>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--light)' }}>
                    Subido: {p.proofUploadedAt ? new Date(p.proofUploadedAt).toLocaleString('es-CO') : '—'}
                    {p.approvedAt && ` · Revisado: ${new Date(p.approvedAt).toLocaleString('es-CO')}`}
                  </p>
                  {p.rejectionReason && (
                    <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 6 }}>
                      <strong>Motivo de rechazo:</strong> {p.rejectionReason}
                    </p>
                  )}
                </div>
                {p.proofUrl && (
                  <a href={p.proofUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={p.proofUrl}
                      alt="Comprobante"
                      style={{
                        maxWidth: 220,
                        maxHeight: 220,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        objectFit: 'cover'
                      }}
                    />
                  </a>
                )}
              </div>
              {p.proofUrl && p.status !== 'APPROVED' && (
                <div className="admin-actions" style={{ marginTop: 14 }}>
                  <button className="btn-sm lime" onClick={() => approve(p.id)}>Aprobar comprobante</button>
                  <button className="btn-sm danger" onClick={() => reject(p.id)}>Rechazar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="admin-card detail-section">
        <h3>Productos</h3>
        <div className="detail-items">
          {order.items.map((i) => (
            <div className="detail-item" key={i.id}>
              <span>{i.quantity}x {i.name} ({i.color || ''} / {i.size || ''})</span>
              <span>{money(i.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card detail-section">
        <h3>Historial</h3>
        <div className="detail-items">
          {order.statusHistory.map((h, i) => (
            <div className="detail-item" key={i}>
              <span>{h.from || '—'} → <strong>{h.to}</strong></span>
              <span>{new Date(h.createdAt).toLocaleString('es-CO')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
