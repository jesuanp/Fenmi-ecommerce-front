import client from './api';

const settingsApi = {
  async get() {
    return (await client.get('/settings/public')).data.data;
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