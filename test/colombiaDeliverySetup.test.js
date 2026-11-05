import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryMethodsForCheckout, prepareDeliverySettings } from '../src/utils/colombiaDeliverySetup.js';

test('las cinco modalidades aparecen, sin habilitar un cobro cuando faltan ajustes', () => {
  const methods = deliveryMethodsForCheckout(null);
  assert.deepEqual(methods.map((m) => m.id), ['meeting_cash','envia_home','envia_office','inter_home','inter_office']);
  assert.ok(methods.every((m) => m.available === false && m.unavailableReason));
});

test('el checkout respeta la capacidad del servidor para crear solicitudes aun sin módulo Colombia activado', () => {
  const methods = deliveryMethodsForCheckout({ enabled: false, options: [{id:'envia_home', available:true}] });
  assert.equal(methods.find((m) => m.id === 'envia_home').available, true);
});

test('preserva la disponibilidad y razón del backend', () => {
  const methods = deliveryMethodsForCheckout({ enabled: true, options: [{ id:'inter_home', available:true, rateMode:'LIVE_AVEONLINE' }, { id:'envia_office', available:false, unavailableReason:'Sin tarifa vigente' }] });
  assert.equal(methods.find((m) => m.id === 'inter_home').available, true);
  assert.equal(methods.find((m) => m.id === 'envia_office').unavailableReason, 'Sin tarifa vigente');
});

test('prepara cinco opciones y conserva sucursales sin inventar tarifas', () => {
  const points = [{ id: 'real', name: 'Punto registrado' }];
  const existing = { enabled: false, options: { envia_home: { enabled: false, flatCost: null } }, locations: points, meetingReservationHours:48 };
  const prepared = prepareDeliverySettings(existing);
  assert.equal(prepared.enabled, true);
  assert.equal(prepared.options.envia_home.rateMode, 'LIVE_AVEONLINE');
  assert.equal(prepared.options.inter_office.rateMode, 'OFFICE_VERIFIED');
  assert.equal(prepared.options.meeting_cash.enabled, true);
  assert.deepEqual(prepared.locations, points);
  assert.equal(prepared.options.envia_home.flatCost, null);
  assert.deepEqual(prepareDeliverySettings(prepared), prepared);
});
