import client from './api';

const TTL = 60_000;
let cache = null;
let inFlight = null;

// Devuelve la config pública de la tienda con cache en memoria para
// evitar refetch en cada componente que la usa (home, checkout, cart, etc.).
const settingsApi = {
  async get() {
    if (cache && Date.now() - cache.at < TTL) return cache.data;
    if (inFlight) return inFlight;
    inFlight = client
      .get('/settings/public')
      .then((r) => {
        cache = { data: r.data.data, at: Date.now() };
        return cache.data;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  },
  invalidate() {
    cache = null;
  }
};

export function money(value) {
  const n = Number(value || 0);
  return `$ ${new Intl.NumberFormat('es-CO').format(n)}`;
}

export function formatShort(value) {
  return new Intl.NumberFormat('es-CO').format(Number(value || 0));
}

export default settingsApi;
