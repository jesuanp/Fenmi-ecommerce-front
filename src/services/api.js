import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true
});

// Token en memoria (evita import circular con Zustand).
let accessToken = localStorage.getItem('fenmi_access') || null;

export function setAccessToken(tok) {
  accessToken = tok;
  if (tok) localStorage.setItem('fenmi_access', tok);
  else localStorage.removeItem('fenmi_access');
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

// Endpoints donde un 401 NO debe disparar refresh: login, registro, recuperación
// de contraseña, etc. En esos casos el propio endpoint es el que falla y debe
// propagar el error directo al caller.
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/account/change-password'
];
const isAuthEndpoint = (url = '') => AUTH_PATHS.some((p) => url.includes(p));

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retried &&
      !isAuthEndpoint(original?.url)
    ) {
      original._retried = true;
      if (!refreshPromise) {
        refreshPromise = client
          .post('/auth/refresh')
          .then((res) => {
            // Guardar el NUEVO access token devuelto por el refresh (rotación).
            const newToken = res?.data?.data?.accessToken;
            if (newToken) setAccessToken(newToken);
            return newToken;
          })
          .catch(() => {
            setAccessToken(null);
            throw error;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      try {
        await refreshPromise;
        if (accessToken) {
          original.headers.Authorization = `Bearer ${accessToken}`;
        }
        return client(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default client;