import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeOfficesForSelect } from '../src/utils/officeSelection.js';

const approved = [
  { id: 'a1', type: 'OFFICE', carrier: 'ENVIA', name: 'Envía Centro', address: 'Carrera 5 # 3-1', city: 'Barranquilla', state: 'Atlántico', readyForCheckout: true },
  { id: 'a2', type: 'OFFICE', carrier: 'ENVIA', name: 'Envía Norte', address: 'Calle 80', city: 'Barranquilla', state: 'Atlántico', readyForCheckout: false },
  { id: 'i1', type: 'OFFICE', carrier: 'INTERRAPIDISIMO', name: 'Inter Centro', address: 'Calle 12', city: 'Bogotá', state: 'Bogotá D.C.', readyForCheckout: true },
  { id: 'm1', type: 'MEETING', name: 'Punto vendedor', address: 'Calle 9', city: 'Barranquilla', state: 'Atlántico', readyForCheckout: true }
];
const directory = [
  { id: 'external1', carrier: 'ENVIA', name: 'Envía Centro', address: 'Carrera 5 # 3-1', city: 'Barranquilla', state: 'Atlántico' },
  { id: 'external2', carrier: 'ENVIA', name: 'Envía Barrio Sur', address: 'Carrera 22', city: 'Barranquilla', state: 'Atlántico' },
  { id: 'foreign', carrier: 'INTERRAPIDISIMO', name: 'Inter', address: 'Calle 35', city: 'Barranquilla', state: 'Atlántico' }
];

test('la lista de envía por municipio muestra puntos y no repite sucursales ya aprobadas', () => {
  const list = mergeOfficesForSelect({ approved, directory, carrier: 'ENVIA', city: 'Barranquilla', state: 'Atlantico' });
  assert.deepEqual(list.map((item) => item.id), ['a1', 'external2', 'a2']);
  assert.equal(list[0].readyForCheckout, true);
  assert.equal(list[2].readyForCheckout, false);
  assert.equal(list[1].fromDirectory, true);
});

test('no se mezclan sucursales de transportadoras ni municipios distintos', () => {
  const list = mergeOfficesForSelect({ approved, directory, carrier: 'INTERRAPIDISIMO', city: 'Barranquilla', state: 'Atlántico' });
  assert.deepEqual(list.map((point) => point.id), ['foreign']);
  assert.equal(list[0].readyForCheckout, false);
});

test('el campo de búsqueda filtra por barrio y dirección', () => {
  const list = mergeOfficesForSelect({ approved, directory, carrier: 'ENVIA', city: 'Barranquilla', state: 'Atlántico', term: 'carrera 22' });
  assert.deepEqual(list.map((item) => item.id), ['external2']);
});

test('los encuentros presenciales no se mezclan con sucursales de envío', () => {
  const list = mergeOfficesForSelect({ approved, directory, mode: 'MEETING' });
  assert.deepEqual(list.map((p) => p.id), ['m1']);
});

test('el checkout contiene lista nativa, directorio oficial y no incrusta mapas', () => {
  const picker = readFileSync(new URL('../src/components/ShippingLocationPicker.jsx', import.meta.url), 'utf8');
  const checkout = readFileSync(new URL('../src/pages/CheckoutPage.jsx', import.meta.url), 'utf8');
  const admin = readFileSync(new URL('../src/components/ColombiaShippingAdmin.jsx', import.meta.url), 'utf8');
  assert.match(picker, /shipping-office-select/);
  assert.match(picker, /orderApi\.shippingOffices/);
  assert.match(picker, /https:\/\/envia\.co\/puntos-de-atencion/);
  assert.match(picker, /https:\/\/www3\.interrapidisimo\.com\/SitioOficinaMasCercana\//);
  assert.doesNotMatch(picker, /leaflet|<iframe|BranchMap|OpenStreetMap/i);
  assert.doesNotMatch(checkout, /<OfficialCarrierExplorer/);
  assert.doesNotMatch(admin, /<label>Latitud|<label>Longitud/);
});
