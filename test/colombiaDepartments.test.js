import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { COLOMBIA_DEPARTMENTS } from '../src/utils/colombiaDepartments.js';

test('el checkout usa un catálogo estable de departamentos de Colombia', () => {
  assert.ok(COLOMBIA_DEPARTMENTS.includes('Atlántico'));
  assert.ok(COLOMBIA_DEPARTMENTS.includes('Antioquia'));
  assert.ok(COLOMBIA_DEPARTMENTS.includes('Bogotá D.C.'));
  assert.ok(COLOMBIA_DEPARTMENTS.includes('Valle del Cauca'));
  assert.equal(new Set(COLOMBIA_DEPARTMENTS).size, COLOMBIA_DEPARTMENTS.length);
});

test('checkout y panel admin seleccionan el departamento desde la misma lista', () => {
  const checkout = fs.readFileSync(path.join(process.cwd(), 'src/pages/CheckoutPage.jsx'), 'utf8');
  const admin = fs.readFileSync(path.join(process.cwd(), 'src/components/ColombiaShippingAdmin.jsx'), 'utf8');
  assert.match(checkout, /COLOMBIA_DEPARTMENTS\.map/);
  assert.match(admin, /COLOMBIA_DEPARTMENTS\.map/);
});
