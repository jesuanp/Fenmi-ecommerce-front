import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, storeLogin } from '@/services/auth';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';

function errMsg(err, fallback) {
  const e = err.response?.data?.error;
  if (e?.details?.length && e.details[0].message) return e.details[0].message;
  return e?.message || fallback;
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const initialEmail = params.get('email') || '';
  const nav = useNavigate();
  const auth = useAuth();
  const ui = useUI();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(Boolean(initialEmail));

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Ingresa tu correo.');
      return;
    }
    setError('');
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setCodeSent(true);
      ui.showToast('Te enviamos un código de verificación');
    } catch (err) {
      setError(errMsg(err, 'No pudimos enviar el código. Verifica el correo.'));
    } finally {
      setResending(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Falta el correo.'); return; }
    if (!password) { setError('Ingresa tu contraseña para continuar.'); return; }
    if (!code) { setError('Ingresa el código de 6 dígitos.'); return; }
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, code });
      const data = await authApi.login({ email, password });
      const user = storeLogin(data);
      auth.setUser(user);
      await auth.afterLogin();
      ui.showToast('Cuenta verificada');
      nav('/', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'No pudimos verificar el código.'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setError('');
    setResending(true);
    try {
      await authApi.resendVerification(email);
      ui.showToast('Código reenviado');
    } catch (err) {
      ui.showToast(errMsg(err, 'No pudimos reenviar el código.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="page-title" style={{ marginBottom: 20 }}>
          Verifica tu correo
        </h1>

        {!codeSent ? (
          <form className="contact-form" onSubmit={sendCode}>
            <p style={{ fontSize: 13, color: 'var(--mid)' }}>
              Ingresa tu correo y te enviaremos un código de verificación.
            </p>
            <input
              className="field"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Correo"
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn block" disabled={resending}>
              {resending ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form className="contact-form" onSubmit={verify}>
            <p style={{ fontSize: 13, color: 'var(--mid)' }}>
              Te enviamos un código de 6 dígitos a <strong>{email}</strong>. Ingrésalo junto con tu contraseña para activar tu cuenta.
            </p>
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
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Contraseña"
            />
            <input
              className="field"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              required
              aria-label="Código de verificación"
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn block" disabled={loading}>
              {loading ? 'Verificando…' : 'Verificar y continuar'}
            </button>
            <button
              type="button"
              className="resend-link"
              onClick={resend}
              disabled={resending}
            >
              {resending ? 'Reenviando…' : 'Reenviar código'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">¿Ya verificaste? Inicia sesión</Link>
          {' · '}
          <Link to="/register">Crear cuenta nueva</Link>
        </div>
      </div>
    </div>
  );
}
