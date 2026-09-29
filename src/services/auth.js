import client from './api';
import { setAccessToken } from './api';

export const authApi = {
  async refresh() {
    return client.post('/auth/refresh');
  },
  async logout() {
    return client.post('/auth/logout');
  },
  async me() {
    return client.get('/auth/me');
  },
  async register({ firstName, lastName, email, password }) {
    return (await client.post('/auth/register', { firstName, lastName, email, password })).data.data;
  },
  async verifyEmail({ email, code }) {
    return (await client.post('/auth/verify-email', { email, code })).data.data;
  },
  async resendVerification(email) {
    return (await client.post('/auth/resend-verification', { email })).data.data;
  },
  async login({ email, password }) {
    return (await client.post('/auth/login', { email, password })).data.data;
  },
  async forgotPassword(email) {
    return (await client.post('/auth/forgot-password', { email })).data.data;
  },
  async resetPassword({ email, code, newPassword }) {
    return (await client.post('/auth/reset-password', { email, code, newPassword })).data.data;
  },
  async changePassword({ currentPassword, newPassword }) {
    return (await client.post('/account/change-password', { currentPassword, newPassword })).data.data;
  },
  async google({ idToken, accessToken, termsAccepted, privacyAccepted }) {
    return (await client.post('/auth/google', { idToken, accessToken, termsAccepted, privacyAccepted })).data.data;
  }
};

// Helper: guarda el access token tras login/registro.
export function storeLogin(data) {
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data?.user || null;
}