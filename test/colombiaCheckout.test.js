import test from 'node:test';
import assert from 'node:assert/strict';
import { needsWompiContract, canConfirmCheckoutPayment } from '../src/utils/colombiaCheckout.js';

test('encuentro presencial no exige ni abre Wompi', () => {
  assert.equal(needsWompiContract('wompi', 'meeting_cash'), false);
  assert.equal(canConfirmCheckoutPayment('wompi', 'meeting_cash', false, false), true);
});
test('envía a domicilio sigue exigiendo contratos para el pago online', () => {
  assert.equal(needsWompiContract('wompi', 'envia_home'), true);
  assert.equal(canConfirmCheckoutPayment('wompi', 'envia_home', false, true), false);
  assert.equal(canConfirmCheckoutPayment('wompi', 'envia_home', true, true), true);
});
test('Inter Rapidísimo a oficina mantiene el flujo seguro de Wompi', () => {
  assert.equal(needsWompiContract('wompi', 'inter_office'), true);
  assert.equal(canConfirmCheckoutPayment('wompi', 'inter_office', true, false), false);
});
test('si el método de pago configurado es manual, no se exigen los contratos de Wompi', () => {
  assert.equal(canConfirmCheckoutPayment('manual', 'envia_home', false, false), true);
});
