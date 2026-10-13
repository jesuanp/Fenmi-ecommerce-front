import client from './api';

// Endpoints de devoluciones para el cliente autenticado.
export const returnsApi = {
  // Crea una solicitud de devolución para uno de los pedidos del cliente.
  // { orderId, reason }
  create: (body) => client.post('/returns', body).then((r) => r.data.data),
  // Lista las solicitudes del cliente autenticado.
  mine: () => client.get('/returns/mine').then((r) => r.data.data)
};
