import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';
import PrivateProofImage from '@/components/PrivateProofImage';
import { orderStage, orderStatusLabel, paymentStatusLabel, TRANSACTION_STATUS_LABELS, shipmentStatusLabel, trackedShipments } from '@/utils/orderDisplay';

const NEXT = {
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['PROCESSING', 'SHIPPED'],
  PAID_STOCK_ISSUE: ['PAID'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED']
};
const REFUNDABLE = ['PAID', 'PAID_STOCK_ISSUE', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const REFUND_STATUS = {
  PROCESSING: 'Solicitud registrada',
  PROCESSING_PROVIDER: 'Esperando confirmación de Wompi',
  AWAITING_MANUAL: 'Reembolso manual pendiente',
  NEEDS_REVIEW: 'Revisión manual requerida',
  SUCCEEDED: 'Reembolso confirmado'
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const ui = useUI();
  const [order, setOrder] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [manualReference, setManualReference] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [shippingModal, setShippingModal] = useState(null);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingBusy, setShippingBusy] = useState(false);

  useEffect(() => { adminApi.getOrder(id).then(setOrder); }, [id]);

  const openShippingModal = (mode) => {
    const shipment = order?.shipments?.[0];
    setCarrier(shipment?.carrier || '');
    setTrackingNumber(shipment?.trackingNumber || '');
    setShippingModal(mode);
  };

  const change = async (toStatus) => {
    if (toStatus === 'SHIPPED') return openShippingModal('ship');
    let note = null;
    if (order.status === 'PAID_STOCK_ISSUE' && toStatus === 'PAID') {
      note = window.prompt('Describe cómo resolviste la incidencia (stock, pago recibido tras cancelación, etc.). Mínimo 10 caracteres:');
      if (note === null) return;
      if (note.trim().length < 10) return ui.showToast('Debes indicar cómo se resolvió la incidencia (mínimo 10 caracteres).');
    }
    if (!window.confirm(`¿Cambiar el pedido a "${orderStatusLabel(toStatus)}"?`)) return;
    try {
      const updated = await adminApi.changeOrderStatus(id, toStatus, note?.trim() || undefined);
      setOrder(updated);
      ui.showToast('Estado actualizado');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'No se pudo actualizar el estado');
    }
  };

  const saveShipping = async (event) => {
    event.preventDefault();
    if (carrier.trim().length < 2) return ui.showToast('Indica la transportadora del pedido.');
    if (shippingBusy) return;
    const details = { carrier: carrier.trim(), trackingNumber: trackingNumber.trim() || null };
    if (shippingModal === 'ship' && !window.confirm('¿Confirmas que el paquete YA fue entregado a la transportadora?')) return;
    setShippingBusy(true);
    try {
      const updated = shippingModal === 'ship'
        ? await adminApi.changeOrderStatus(id, 'SHIPPED', undefined, details)
        : await adminApi.updateOrderShipment(id, details);
      setOrder(updated);
      setShippingModal(null);
      ui.showToast(shippingModal === 'ship' ? 'Envío registrado' : 'Información de envío actualizada');
    } catch (error) {
      ui.showToast(error.response?.data?.error?.message || 'No se pudo guardar el envío');
    } finally {
      setShippingBusy(false);
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

  const stage = orderStage(order);
  const tracking = trackedShipments(order);

  const requestRefund = async () => {
    const reason = window.prompt('Motivo para solicitar el reembolso de este pedido:');
    if (!reason || reason.trim().length < 5) return;
    if (!window.confirm('Esto iniciará la solicitud de devolución. El dinero no se considerará devuelto hasta recibir confirmación. ¿Continuar?')) return;
    setRefunding(true);
    try {
      const updated = await adminApi.changeOrderStatus(id, 'REFUND_PENDING', reason.trim());
      setOrder(updated);
      ui.showToast('Solicitud registrada. Comprueba su estado en este pedido.');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'Error al solicitar el reembolso');
    } finally { setRefunding(false); }
  };

  const confirmManualRefund = async () => {
    if (manualReference.trim().length < 8) return ui.showToast('Indica una referencia de al menos ocho caracteres.');
    if (!window.confirm('Confirma solo si el dinero YA fue devuelto fuera de la plataforma. ¿Confirmar?')) return;
    setRefunding(true);
    try {
      await adminApi.confirmManualRefund(order.refund.id, manualReference.trim());
      setOrder(await adminApi.getOrder(id));
      setManualReference('');
      ui.showToast('Reembolso manual registrado con evidencia');
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'No se pudo confirmar el reembolso');
    } finally { setRefunding(false); }
  };

  // Pagos Wompi sin comprobante (el widget no genera captura).
  const wompiPayment = (order.payments || []).find(
    (p) => p.provider === 'wompi' && p.status !== 'APPROVED'
  );

  const syncWompi = async () => {
    if (!window.confirm('¿Consultar el estado real de la transacción en Wompi y confirmarla si quedó aprobada?')) return;
    setSyncing(true);
    try {
      const r = await adminApi.syncOrderPayment(id);
      setOrder(r.order || (await adminApi.getOrder(id)));
      ui.showToast(
        r.status === 'APPROVED'
          ? 'Pago confirmado desde Wompi'
          : `Wompi responde: ${r.status}`
      );
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'No se pudo sincronizar con Wompi');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="admin-top">
        <h1 className="admin-title">{order.orderNumber}</h1>
        <Link className="btn-sm" to="/admin/orders">← Pedidos</Link>
      </div>

      <div className="detail-grid">
        <div className="admin-card detail-section">
          <h3>Estado</h3>
          <p>Estado: <span className={'status-badge ' + order.status.toLowerCase()}>{orderStatusLabel(order.status)}</span></p>
          <p>Pago: <span className={'status-badge ' + (order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'FAILED' ? 'cancelled' : 'pending')}>{paymentStatusLabel(order.paymentStatus)}</span></p>
          <p style={{ fontWeight: 700, marginTop: 12 }}>{stage.heading}</p>
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>{stage.description}</p>
          {/* El pago entró pero no había stock suficiente. El dinero está
              cobrado: hay que reponer y enviar, o reembolsar. */}
          {order.status === 'PAID_STOCK_ISSUE' && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: '#fde7e6',
                color: '#8a2c20',
                fontSize: 13
              }}
            >
              <strong>Pago recibido con incidencia.</strong> Puede tratarse de falta de inventario o de un cobro recibido después de cancelar el pedido. Revisa el historial y confirma cómo resolviste el caso antes de autorizar la preparación; si corresponde, solicita un reembolso verificable.
            </div>
          )}
          {NEXT[order.status]?.length > 0 && (
            <div className="admin-actions" style={{ marginTop: 12 }}>
              {NEXT[order.status].map((s) => (
                <button key={s} className="btn-sm" onClick={() => change(s)}>{s === 'SHIPPED' ? 'Registrar despacho' : `Marcar: ${orderStatusLabel(s)}`}</button>
              ))}
            </div>
          )}
          {REFUNDABLE.includes(order.status) && order.paymentStatus === 'PAID' && (
            <div className="admin-actions" style={{ marginTop: 12 }}>
              <button className="btn-sm danger" onClick={requestRefund} disabled={refunding}>
                {refunding ? 'Procesando…' : 'Solicitar reembolso'}
              </button>
            </div>
          )}
          {order.refund && (
            <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <strong>Reembolso: {REFUND_STATUS[order.refund.status] || order.refund.status}</strong>
              {order.refund.status === 'NEEDS_REVIEW' && (
                <p>Verifica el resultado real en el portal de Wompi. No repitas el reembolso sin confirmar qué ocurrió con el intento original.</p>
              )}
              {order.refund.status === 'AWAITING_MANUAL' && (
                <div style={{ marginTop: 10 }}>
                  <p>Realiza la devolución en el banco o método original. Después registra el comprobante de la operación.</p>
                  <input aria-label="Referencia de devolución" value={manualReference} onChange={(e) => setManualReference(e.target.value)} placeholder="Referencia verificable de la devolución" style={{ width: '100%', marginBottom: 8 }} />
                  <button className="btn-sm" disabled={refunding || manualReference.trim().length < 8} onClick={confirmManualRefund}>Confirmar devolución realizada</button>
                </div>
              )}
              {order.refund.providerRefundId && <p style={{ fontSize: 12 }}>Referencia del proveedor: {order.refund.providerRefundId}</p>}
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
          <h3>Dirección y método de entrega</h3>
          <p>{order.shipping?.recipient}</p>
          <p>{order.shipping?.line1} {order.shipping?.line2 || ''}</p>
          <p>{order.shipping?.city}, {order.shipping?.state}</p>
          <p>{order.shipping?.phone}</p>
          <p>Método: {order.shipping?.method?.methodName} · {money(order.shippingTotal)}</p>
        </div>

        <div className="admin-card detail-section">
          <h3>Preparación y seguimiento</h3>
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>{stage.description}</p>
          {tracking.map((shipment) => (
            <div key={shipment.id} style={{ marginTop: 10 }}>
              <p>Situación: <strong>{shipmentStatusLabel(shipment.status)}</strong></p>
              {shipment.carrier && <p>Transportadora: <strong>{shipment.carrier}</strong></p>}
              {shipment.trackingNumber && <p>Guía: <strong>{shipment.trackingNumber}</strong></p>}
              {!shipment.trackingNumber && <p style={{ color: 'var(--mid)', fontSize: 12 }}>Guía todavía no registrada.</p>}
            </div>
          ))}
          {['SHIPPED', 'DELIVERED'].includes(order.status) && order.paymentStatus === 'PAID' && (
            <button className="btn-sm" style={{ marginTop: 10 }} onClick={() => openShippingModal('edit')}>Actualizar transportadora o guía</button>
          )}
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
          <h3>Pagos y comprobantes</h3>
          {(order.payments || []).map((p) => (
            <div key={p.id} style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <p style={{ fontSize: 13, color: 'var(--mid)' }}>
                    <strong>{p.provider === 'wompi' ? 'Pasarela: Wompi' : `Banco: ${p.bank || 'Sin especificar'}`}</strong> ·{' '}
                    <strong>Estado:</strong>{' '}
                    <span className={'status-badge ' + (p.status === 'APPROVED' ? 'paid' : (p.status === 'PENDING' ? 'pending' : 'cancelled'))}>
                      {TRANSACTION_STATUS_LABELS[p.status] || p.status}
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
                  <PrivateProofImage paymentId={p.id} />
                )}
              </div>
              {p.proofUrl && p.status !== 'APPROVED' && (
                <div className="admin-actions" style={{ marginTop: 14 }}>
                  <button className="btn-sm lime" onClick={() => approve(p.id)}>Aprobar comprobante</button>
                  <button className="btn-sm danger" onClick={() => reject(p.id)}>Rechazar</button>
                </div>
              )}
              {p.id === wompiPayment?.id && (
                <div className="admin-actions" style={{ marginTop: 14 }}>
                  <button className="btn-sm" onClick={syncWompi} disabled={syncing}>
                    {syncing ? 'Consultando Wompi…' : '⟳ Sincronizar con Wompi'}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--light)', alignSelf: 'center' }}>
                    Consulta el estado real de la transacción y la confirma si quedó aprobada.
                  </span>
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
              <span>
                {h.from ? orderStatusLabel(h.from) : 'Inicio'} → <strong>{orderStatusLabel(h.to)}</strong>
                {h.note && <small style={{ display: 'block', marginTop: 3, color: 'var(--mid)' }}>{h.note}</small>}
              </span>
              <span>{new Date(h.createdAt).toLocaleString('es-CO')}</span>
            </div>
          ))}
        </div>
      </div>

      {shippingModal && (
        <div className="modal-backdrop" onClick={() => !shippingBusy && setShippingModal(null)}>
          <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={saveShipping} style={{ maxWidth: 480 }}>
            <h3>{shippingModal === 'ship' ? 'Registrar envío real' : 'Actualizar información del envío'}</h3>
            <p style={{ fontSize: 13, color: 'var(--mid)' }}>
              {shippingModal === 'ship'
                ? 'Usa esta opción únicamente después de entregar el paquete a la transportadora.'
                : 'Actualiza los datos de la transportadora o la guía del pedido.'}
            </p>
            <label style={{ display: 'block', marginBottom: 12 }}>Transportadora
              <input value={carrier} onChange={(event) => setCarrier(event.target.value)} minLength={2} maxLength={120} required placeholder="Nombre de la transportadora" style={{ width: '100%', marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>Número de guía (opcional)
              <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} maxLength={120} placeholder="Se puede completar más adelante" style={{ width: '100%', marginTop: 6 }} />
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn outline small" onClick={() => setShippingModal(null)} disabled={shippingBusy}>Cancelar</button>
              <button type="submit" className="btn lime small" disabled={shippingBusy || carrier.trim().length < 2}>
                {shippingBusy ? 'Guardando…' : shippingModal === 'ship' ? 'Confirmar despacho' : 'Guardar datos'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
