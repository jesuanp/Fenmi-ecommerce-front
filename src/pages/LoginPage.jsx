import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, storeLogin } from '@/services/auth';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';

export default function LoginPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const ui = useUI();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      const user = storeLogin(data);
      auth.setUser(user);
      await auth.afterLogin();
      ui.showToast('Bienvenida de nuevo');
      nav(user?.role === 'ADMIN' ? '/admin' : '/', { replace: true });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setError('Debes verificar tu correo antes de iniciar sesión.');
      } else {
        setError(err.response?.data?.error?.message || 'Correo o contraseña incorrectos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="page-title" style={{ marginBottom: 20 }}>
          Iniciar sesión
        </h1>
        <form className="contact-form" onSubmit={submit}>
          <input
            className="field"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Correo"
          />
          <input
            className="field"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Contraseña"
          />
          {error && <p className="form-error">{error}</p>}
          <button className="btn block" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/register">¿No tienes cuenta? Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
