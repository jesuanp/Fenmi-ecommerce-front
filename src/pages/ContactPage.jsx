import React, { useState } from 'react';
import useUI from '@/stores/ui';
import client from '@/services/api';

export default function ContactPage() {
  const ui = useUI();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    const form = e.target;
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value || null,
      message: form.message.value
    };
    try {
      await client.post('/contact', payload);
      setSent(true);
    } catch {
      ui.showToast('No se pudo enviar. Intenta de nuevo en unos minutos.');
      setSending(false);
    }
  };

  return (
    <div className="narrow">
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        Contacto
      </h1>
      {sent ? (
        <div className="empty-state">
          <h3>¡Mensaje enviado!</h3>
          <p>Te responderemos lo antes posible.</p>
        </div>
      ) : (
        <form className="contact-form" onSubmit={submit}>
          <input className="field" name="name" placeholder="Nombre" required aria-label="Nombre" />
          <input
            className="field"
            name="email"
            placeholder="Correo electrónico"
            type="email"
            required
            aria-label="Correo electrónico"
          />
          <input className="field" name="phone" placeholder="Teléfono" aria-label="Teléfono" />
          <textarea
            className="field textarea"
            name="message"
            placeholder="Comentario"
            required
            aria-label="Mensaje"
          />
          <button className="btn block" type="submit" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>
      )}
    </div>
  );
}