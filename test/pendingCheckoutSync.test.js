import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePendingCheckout, canRequestStaleRelease } from '../src/utils/pendingCheckoutSync.js';

test('detecta cuando el pedido guardado coincide con el actual', () => {
  assert.equal(comparePendingCheckout({ orderId: '3' }, { orderId: 3 }), 'MATCH');
});

test('detecta cuando el navegador guarda un pedido cancelado o inexistente', () => {
  assert.equal(comparePendingCheckout({ orderId: 3 }, null), 'NO_SERVER');
});

test('no libera un pedido si el backend tiene uno pendiente distinto', () => {
  assert.equal(comparePendingCheckout({ orderId: 3 }, { orderId: 5 }), 'DIFFERENT');
});

test('puede solicitar al backend liberar un pedido cancelado tras consultar Wompi', () => {
  assert.equal(canRequestStaleRelease({ orderStatus: 'CANCELLED', status: 'VOIDED', confirmed: false, verification: 'CHECKED' }), true);
});

test('no abre otro cobro mientras el pago sigue pendiente', () => {
  assert.equal(canRequestStaleRelease({ orderStatus: 'CANCELLED', status: 'PENDING', verification: 'CHECKED' }), true);
  assert.equal(canRequestStaleRelease({ orderStatus: 'PENDING_PAYMENT', status: 'FAILED', verification: 'CHECKED' }), false);
});

test('no descarta intentos cuando la consulta al proveedor falla o hay un pago confirmado', () => {
  assert.equal(canRequestStaleRelease({ orderStatus: 'CANCELLED', status: 'VOIDED', verification: 'UNAVAILABLE' }), false);
  assert.equal(canRequestStaleRelease({ orderStatus: 'CANCELLED', status: 'VOIDED', confirmed: true }), false);
});
