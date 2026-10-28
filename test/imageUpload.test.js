import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
  validateImageFile,
  getImageUploadError,
  prepareImageForUpload
} from '../src/utils/imageUpload.js';

test('acepta imágenes de tamaño permitido', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES }), '');
  assert.equal(validateImageFile({ type: 'image/webp', size: 2000 }), '');
});

test('rechaza archivos de tamaño excesivo con un aviso explícito', () => {
  assert.match(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }), new RegExp(`${MAX_IMAGE_MB} MB`));
});

test('rechaza archivos que no sean imágenes admitidas', () => {
  assert.match(validateImageFile({ type: 'application/pdf', size: 100 }), /JPG, PNG, WEBP o GIF/);
});

test('muestra un mensaje útil si Nginx o el backend responde HTTP 413', () => {
  assert.match(getImageUploadError({ response: { status: 413 } }), new RegExp(`${MAX_IMAGE_MB} MB`));
});

test('mantiene la imagen si no hay navegador ni canvas', async () => {
  const file = { type: 'image/png', size: 512, name: 'foto.png' };
  assert.equal(await prepareImageForUpload(file), file);
});

test('no altera los GIF animados', async () => {
  const file = { type: 'image/gif', size: 512, name: 'demo.gif' };
  assert.equal(await prepareImageForUpload(file), file);
});

test('convierte fotografías grandes a WEBP cuando el navegador dispone de canvas', async () => {
  const oldDocument = globalThis.document;
  const oldBitmap = globalThis.createImageBitmap;
  const oldFile = globalThis.File;
  let resultWidth = 0;
  let resultHeight = 0;
  let closed = false;
  globalThis.File = class File {
    constructor(parts, name, props) {
      this.parts = parts;
      this.name = name;
      this.type = props.type;
      this.size = parts[0].size;
    }
  };
  globalThis.createImageBitmap = async () => ({
    width: 4000,
    height: 3000,
    close() { closed = true; }
  });
  globalThis.document = {
    createElement() {
      const canvas = {
        width: 0,
        height: 0,
        getContext() {
          return { drawImage() { resultWidth = canvas.width; resultHeight = canvas.height; } };
        },
        toBlob(done) { done({ size: 40000, type: 'image/webp' }); }
      };
      return canvas;
    }
  };
  try {
    const prepared = await prepareImageForUpload({ size: 2000000, type: 'image/jpeg', name: 'camisa.jpg' }, { maxWidth: 1200, maxHeight: 1200 });
    assert.equal(prepared.type, 'image/webp');
    assert.equal(prepared.name, 'camisa.webp');
    assert.equal(resultWidth, 1200);
    assert.equal(resultHeight, 900);
    assert.ok(closed);
  } finally {
    globalThis.document = oldDocument;
    globalThis.createImageBitmap = oldBitmap;
    globalThis.File = oldFile;
  }
});
