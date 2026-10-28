import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const tokens = read('styles/tokens.css');
const layout = read('styles/layout.css');
const pages = read('styles/pages.css');
const publicLayout = read('layouts/PublicLayout.jsx');
const header = read('components/Header.jsx');
const home = read('pages/HomePage.jsx');

test('el header y el espacio superior comparten la misma variable', () => {
  assert.match(tokens, /--header-height:\s*64px\s*;/);
  assert.match(layout, /\.header-inner\s*\{[^}]*height:\s*var\(--header-height\)/s);
  assert.match(pages, /\.site\s*>\s*\.public-main\s*\{[^}]*padding-top:\s*var\(--header-height\)/s);
});

test('el header compacto mantiene la misma altura que el desplazamiento móvil', () => {
  assert.match(layout, /@media\s*\(max-width:\s*900px\)\s*\{\s*:root\s*\{\s*--header-height:\s*58px/s);
  assert.match(layout, /\.header-inner\s*\{[^}]*height:\s*var\(--header-height\)/s);
});

test('la portada conserva el hero superpuesto solo cuando está en primera posición', () => {
  assert.match(publicLayout, /showHomeHero\s*=\s*pathname\s*===\s*'\/'\s*&&\s*homeHeroAtTop/);
  assert.match(publicLayout, /showHomeHero\s*\?\s*'public-main public-main--home'\s*:\s*'public-main'/);
  assert.match(home, /setHomeHeroAtTop\(firstBlockType\s*===\s*'hero'\)/);
  assert.match(header, /isHome\s*&&\s*transparentOnHome\s*&&\s*!scrolled/);
  assert.match(pages, /\.site\s*>\s*\.public-main--home\s*\{[^}]*padding-top:\s*0/s);
});

test('ya no hay compensaciones !important en componentes internos', () => {
  assert.doesNotMatch(pages, /padding-top:\s*var\(--header-height[^;]*!important/i);
  assert.match(publicLayout, /<main className=\{showHomeHero/);
});

test('la navegación y los enlaces a secciones evitan ocultar el contenido', () => {
  assert.match(publicLayout, /useLayoutEffect\(\(\)\s*=>\s*\{\s*window\.scrollTo\(0,\s*0\);\s*\},\s*\[pathname\]\)/s);
  assert.match(tokens, /scroll-padding-top:\s*calc\(var\(--header-height\)\s*\+\s*16px\)/);
  assert.match(tokens, /:target\s*\{\s*scroll-margin-top:/);
});
