import test from 'node:test';
import assert from 'node:assert/strict';
import { orderStage, orderStatusLabel, trackedShipments, shipmentStatusLabel, paymentStatusLabel } from '../src/utils/orderDisplay.js';

const legacy = { id: 1, status: 'PENDING', carrier: null, trackingNumber: null };
const actual = { id: 2, status: 'SHIPPED', carrier: 'Servientrega', shippedAt: new Date().toISOString(), trackingNumber: 'X123' };

for (const status of ['PENDING_PAYMENT', 'PAID', 'PAID_STOCK_ISSUE', 'PROCESSING', 'CANCELLED']) {
  test(`${status} no habilita seguimiento de un envío inexistente`, () => {
    assert.deepEqual(trackedShipments({ status, paymentStatus: status === 'PENDING_PAYMENT' ? 'PENDING' : 'PAID', shipments: [legacy] }), []);
  });
}
test('pedido pendiente dice explícitamente que no se está preparando', () => {
  assert.match(orderStage({ status: 'PENDING_PAYMENT' }).description, /no se está preparando/i);
  assert.equal(orderStatusLabel('PENDING_PAYMENT'), 'Pendiente de pago');
});
test('un pedido enviado y pagado muestra la guía existente', () => {
  assert.deepEqual(trackedShipments({ status: 'SHIPPED', paymentStatus: 'PAID', shipments: [actual] }), [actual]);
  assert.equal(shipmentStatusLabel('SHIPPED'), 'Enviado');
});
test('no hay envío visible si el pago no está confirmado', () => {
  assert.deepEqual(trackedShipments({ status: 'SHIPPED', paymentStatus: 'PENDING', shipments: [actual] }), []);
});
test('un reembolso solo conserva seguimiento de un envío real', () => {
  assert.deepEqual(trackedShipments({ status: 'REFUNDED', paymentStatus: 'REFUNDED', shipments: [legacy, actual] }), [actual]);
});
test('cierre de pedido cancelado y reembolso son mensajes distintos', () => {
  assert.notEqual(orderStage({ status: 'CANCELLED' }).heading, orderStage({ status: 'REFUNDED' }).heading);
  assert.equal(paymentStatusLabel('REFUNDED'), 'Reembolsado');
});
