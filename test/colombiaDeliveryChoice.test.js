import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  deliveryMethodsForCheckout, FENMI_DELIVERY_GROUPS, selectedDeliveryGroup,
  deliveryMethodFor, changeDeliveryGroup
} from '../src/utils/colombiaDeliverySetup.js';

test('tres decisiones principales visibles: encuentro, envía e Inter Rapidísimo', () => {
  assert.deepEqual(FENMI_DELIVERY_GROUPS.map((g) => g.id), ['meeting', 'envia', 'inter']);
});

test('la elección del transportista permite cambiar entre domicilio y oficina', () => {
  for (const group of ['envia', 'inter']) {
    const home = deliveryMethodFor(group, 'HOME');
    const office = deliveryMethodFor(group, 'OFFICE');
    assert.equal(home, `${group}_home`);
    assert.equal(office, `${group}_office`);
    assert.equal(selectedDeliveryGroup(home), group);
    assert.equal(selectedDeliveryGroup(office), group);
    assert.equal(changeDeliveryGroup(group, office), office);
    assert.equal(changeDeliveryGroup(group, home), home);
  }
  assert.equal(changeDeliveryGroup('inter', 'envia_office'), 'inter_office');
  assert.equal(changeDeliveryGroup('meeting', 'envia_office'), 'meeting_cash');
  assert.equal(deliveryMethodFor('desconocido'), '');
});

test('las cinco modalidades permanecen seleccionables aun sin tarifa; disponibilidad es separada', () => {
  const methods = deliveryMethodsForCheckout({ enabled: false, options: [] });
  assert.equal(methods.length, 5);
  assert.ok(methods.every((m) => m.available === false));
  assert.ok(methods.every((m) => m.unavailableReason));
});

test('el checkout no deshabilita los radios de los tres métodos cuando falta tarifa', () => {
  const jsx = readFileSync(new URL('../src/pages/CheckoutPage.jsx', import.meta.url), 'utf8');
  assert.match(jsx, /name="delivery-group"/);
  assert.match(jsx, /name="delivery-place"/);
  assert.doesNotMatch(jsx, /name="delivery-group"[^>]+disabled=/);
  assert.doesNotMatch(jsx, /name="delivery-place"[^>]+disabled=/);
  assert.match(jsx, /selectedMethod\?\.available === false/);
  assert.match(jsx, /!\(infoValid && addrValid && methodValid\)/);
});
