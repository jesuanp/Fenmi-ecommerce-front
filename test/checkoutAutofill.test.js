import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKOUT_PROFILE_FIELDS,
  CHECKOUT_ADDRESS_FIELDS,
  fillEmptyCheckoutFields
} from '../src/utils/checkoutAutofill.js';
import { normalizeSavedPostalCode } from '../src/utils/postalCode.js';

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  recipient: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  instructions: '',
  methodId: ''
});

const profile = {
  id: 14,
  firstName: 'Laura',
  lastName: 'Acevedo',
  email: 'laura@example.com',
  phone: '3001234567'
};

test('recarga directa: al recibir la sesión completa los datos del cliente inicialmente vacíos', () => {
  const before = emptyForm();
  const after = fillEmptyCheckoutFields(before, profile, CHECKOUT_PROFILE_FIELDS);
  assert.equal(after.firstName, 'Laura');
  assert.equal(after.lastName, 'Acevedo');
  assert.equal(after.email, 'laura@example.com');
  assert.equal(after.phone, '3001234567');
  assert.equal(after.line1, '');
  assert.deepEqual(before, emptyForm());
});

test('preserva los campos editados mientras se recuperaba la sesión', () => {
  const before = { ...emptyForm(), firstName: 'María', email: '' };
  const touched = new Set(['firstName', 'email']);
  const after = fillEmptyCheckoutFields(before, profile, CHECKOUT_PROFILE_FIELDS, touched);
  assert.equal(after.firstName, 'María');
  assert.equal(after.email, '');
  assert.equal(after.lastName, 'Acevedo');
  assert.equal(after.phone, '3001234567');
});

test('respeta datos introducidos anteriormente y completa únicamente los faltantes', () => {
  const before = { ...emptyForm(), firstName: 'Pedro', phone: '3100000000' };
  const after = fillEmptyCheckoutFields(before, profile, CHECKOUT_PROFILE_FIELDS);
  assert.equal(after.firstName, 'Pedro');
  assert.equal(after.phone, '3100000000');
  assert.equal(after.lastName, 'Acevedo');
  assert.equal(after.email, 'laura@example.com');
});

test('no introduce datos falsos cuando el perfil está incompleto', () => {
  const before = emptyForm();
  const after = fillEmptyCheckoutFields(before, { firstName: 'Sara', email: null, phone: undefined }, CHECKOUT_PROFILE_FIELDS);
  assert.equal(after.firstName, 'Sara');
  assert.equal(after.email, '');
  assert.equal(after.phone, '');
});

test('la dirección guardada completa el envío sin reemplazar el teléfono del perfil', () => {
  const withProfile = fillEmptyCheckoutFields(emptyForm(), profile, CHECKOUT_PROFILE_FIELDS);
  const after = fillEmptyCheckoutFields(withProfile, {
    recipient: 'Laura',
    phone: '3122222222',
    line1: 'Carrera 12 # 5-10',
    city: 'Medellín',
    state: 'Antioquia'
  }, CHECKOUT_ADDRESS_FIELDS);
  assert.equal(after.phone, '3001234567');
  assert.equal(after.line1, 'Carrera 12 # 5-10');
  assert.equal(after.city, 'Medellín');
  assert.equal(after.state, 'Antioquia');
});

test('la dirección guardada no reemplaza lo que se escribió manualmente', () => {
  const before = { ...emptyForm(), city: 'Cali', line1: '' };
  const touched = new Set(['city', 'line1']);
  const after = fillEmptyCheckoutFields(before, { city: 'Bogotá', line1: 'Calle 24', recipient: 'Laura' }, CHECKOUT_ADDRESS_FIELDS, touched);
  assert.equal(after.city, 'Cali');
  assert.equal(after.line1, '');
  assert.equal(after.recipient, 'Laura');
});

test('una dirección guardada con código postal inválido no lo reintroduce', () => {
  const before = emptyForm();
  const after = fillEmptyCheckoutFields(before, {
    postal_code: normalizeSavedPostalCode('12345'),
    city: 'Bogotá'
  }, CHECKOUT_ADDRESS_FIELDS);
  assert.equal(after.postal_code, '');
  assert.equal(after.city, 'Bogotá');
});

test('no genera cambios innecesarios de estado si ya están completos los campos', () => {
  const filled = fillEmptyCheckoutFields(emptyForm(), profile, CHECKOUT_PROFILE_FIELDS);
  assert.equal(fillEmptyCheckoutFields(filled, profile, CHECKOUT_PROFILE_FIELDS), filled);
  assert.equal(fillEmptyCheckoutFields(filled, null, CHECKOUT_PROFILE_FIELDS), filled);
});
