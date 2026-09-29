import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, storeLogin } from '@/services/auth';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';

function errMsg(err, fallback) {
  const e = err.response?.data?.error;
  if (e?.details?.length && e.details[0].message) return e.details[0].message;
  return e?.message || fallback;
}

export default function RegisterPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const ui = useUI();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    termsAccepted: false,
    privacyAccepted: false
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit = form.termsAccepted && form.privacyAccepted;

  const register = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Debes aceptar los términos y la política de privacidad.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(form);
      setStep(1);
      ui.showToast('Te enviamos un código de verificación');
    } catch (err) {
      setError(errMsg(err, 'No pudimos registrarte.'));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyEmail({ email: form.email, code });
      const data = await authApi.login({ email: form.email, password: form.password });
      const user = storeLogin(data);
      auth.setUser(user);
      await auth.afterLogin();
      ui.showToast('Cuenta creada');
      nav('/', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'El código no es válido.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="page-title" style={{ marginBottom: 20 }}>
          {step === 0 ? 'Crear cuenta' : 'Verifica tu correo'}
        </h1>
        {step === 0 ? (
          <form className="contact-form" onSubmit={register}>
            <input
              className="field" placeholder="Nombre" value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)} required aria-label="Nombre"
            />
            <input
              className="field" placeholder="Apellido" value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)} required aria-label="Apellido"
            />
            <input
              className="field" type="email" placeholder="Correo electrónico" value={form.email}
              onChange={(e) => set('email', e.target.value)} required aria-label="Correo"
            />
            <input
              className="field" type="password" placeholder="Contraseña (mín. 8)" value={form.password}
              onChange={(e) => set('password', e.target.value)} required aria-label="Contraseña"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="terms-label">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => set('termsAccepted', e.target.checked)}
                />
                <span className={`terms-text ${form.termsAccepted ? 'checked' : ''}`}>
                  Acepto los{' '}
                  <a
                    href="/policies?t=terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      set('termsAccepted', true);
                      window.open('/policies?t=terms', '_blank');
                    }}
                  >
                    Términos y Condiciones
                  </a>
                </span>
              </label>
              <label className="terms-label">
                <input
                  type="checkbox"
                  checked={form.privacyAccepted}
                  onChange={(e) => set('privacyAccepted', e.target.checked)}
                />
                <span className={`terms-text ${form.privacyAccepted ? 'checked' : ''}`}>
                  Acepto la{' '}
                  <a
                    href="/policies?t=privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      set('privacyAccepted', true);
                      window.open('/policies?t=privacy', '_blank');
                    }}
                  >
                    Política de Privacidad
                  </a>
                </span>
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="btn block" disabled={loading || !canSubmit}>
              {loading ? 'Creando…' : 'Registrarme'}
            </button>
          </form>
        ) : (
          <form className="contact-form" onSubmit={verify}>
            <p style={{ fontSize: 13, color: 'var(--mid)' }}>
              Ingresa el código de 6 dígitos que enviamos a <strong>{form.email}</strong>
            </p>
            <input
              className="field" placeholder="Código" value={code}
              onChange={(e) => setCode(e.target.value)} required aria-label="Código"
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn block" disabled={loading}>
              {loading ? 'Verificando…' : 'Verificar y continuar'}
            </button>
            <button
              type="button"
              className="resend-link"
              onClick={async () => {
                try {
                  await authApi.resendVerification(form.email);
                  if (typeof ui.showToast === 'function') ui.showToast('Código reenviado');
                } catch {
                  if (typeof ui.showToast === 'function') ui.showToast('Revisa tu correo');
                }
              }}
            >
              Reenviar código
            </button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
