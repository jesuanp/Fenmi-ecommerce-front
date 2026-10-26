export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pago confirmado',
  PAID_STOCK_ISSUE: 'Pago confirmado · requiere revisión',
  PROCESSING: 'Preparando pedido',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUND_PENDING: 'Reembolso solicitado',
  REFUNDED: 'Reembolsado'
};

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendiente de confirmación',
  PAID: 'Confirmado',
  FAILED: 'No completado',
  REFUNDED: 'Reembolsado'
};

export const TRANSACTION_STATUS_LABELS = {
  PENDING: 'Pendiente de confirmación',
  APPROVED: 'Aprobado',
  DECLINED: 'Rechazado',
  FAILED: 'Fallido',
  VOIDED: 'Anulado',
  REFUNDED: 'Reembolsado'
};

export const SHIPMENT_STATUS_LABELS = {
  PENDING: 'Aún no despachado',
  PREPARING: 'Preparando pedido',
  SHIPPED: 'Enviado',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  FAILED: 'Incidencia en el envío'
};

const ORDER_STAGES = {
  PENDING_PAYMENT: {
    heading: 'Esperando confirmación del pago',
    description: 'Tu pedido todavía no se está preparando y no se ha iniciado el envío.'
  },
  PAID: {
    heading: 'Pago confirmado',
    description: 'Recibimos el pago. La preparación del pedido aún no ha comenzado.'
  },
  PAID_STOCK_ISSUE: {
    heading: 'Tu compra requiere revisión',
    description: 'El pago fue recibido, pero hay una incidencia por resolver antes de preparar el envío. Nuestro equipo revisará tu pedido.'
  },
  PROCESSING: {
    heading: 'Estamos preparando tu pedido',
    description: 'Tu compra está en preparación. Todavía no se ha entregado a la transportadora.'
  },
  SHIPPED: {
    heading: 'Tu pedido fue enviado',
    description: 'Consulta la información del transporte más abajo. Si aún no hay guía, estará disponible cuando se registre.'
  },
  DELIVERED: {
    heading: 'Pedido entregado',
    description: 'El pedido figura como entregado.'
  },
  CANCELLED: {
    heading: 'Pedido cancelado',
    description: 'Este pedido está cancelado y no se preparará ni enviará. Si ves un cargo bancario, contáctanos para verificarlo.'
  },
  REFUND_PENDING: {
    heading: 'Reembolso en trámite',
    description: 'El reembolso fue solicitado, pero todavía no consta como devuelto.'
  },
  REFUNDED: {
    heading: 'Reembolso confirmado',
    description: 'La devolución del dinero figura como confirmada en este pedido.'
  }
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || 'Sin estado';
}

export function paymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || 'Sin información';
}

export function orderStage(order) {
  return ORDER_STAGES[order?.status] || {
    heading: 'Estado de pedido no disponible',
    description: 'Comunícate con nuestro equipo para verificar el estado.'
  };
}

export function trackedShipments(order) {
  const rows = Array.isArray(order?.shipments) ? order.shipments : [];
  if (['SHIPPED', 'DELIVERED'].includes(order?.status) && order?.paymentStatus === 'PAID') {
    return rows;
  }
  if (['REFUND_PENDING', 'REFUNDED'].includes(order?.status)) {
    return rows.filter((shipment) =>
      ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(shipment.status) ||
      Boolean(shipment.shippedAt || shipment.deliveredAt)
    );
  }
  return [];
}

export function shipmentStatusLabel(status) {
  return SHIPMENT_STATUS_LABELS[status] || 'Estado de envío por confirmar';
}
