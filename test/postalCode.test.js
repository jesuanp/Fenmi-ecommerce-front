import test from 'node:test';
import assert from 'node:assert/strict';
import { isOptionalPostalCodeValid, normalizeSavedPostalCode } from '../src/utils/postalCode.js';

for (const [code, valid] of [
  [undefined, true],
  [null, true],
  ['', true],
  ['  ', true],
  ['050001', true],
  [' 050001 ', true],
  ['05001', false],
  ['0500010', false],
  ['abc123', false],
  ['123-45', false]
]) {
  test(`validación del código postal ${JSON.stringify(code)}`, () => {
    assert.equal(isOptionalPostalCodeValid(code), valid);
  });
}

for (const [code, result] of [
  ['050001', '050001'],
  [' 050001 ', '050001'],
  ['05001', ''],
  ['AB0001', ''],
  [null, ''],
  [undefined, '']
]) {
  test(`limpieza de dirección guardada ${JSON.stringify(code)}`, () => {
    assert.equal(normalizeSavedPostalCode(code), result);
  });
}
