import client from './api';

// El backend guarda la última dirección automáticamente al crear el pedido,
// así que aquí solo hace falta leerla.
export const addressApi = {
  async list() {
    return (await client.get('/addresses')).data.data;
  }
};