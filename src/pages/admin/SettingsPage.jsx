import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

export default function AdminSettingsPage() {
  const ui = useUI();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminApi.getSettings().then(setSettings); }, []);

  const set = (section, key, value) =>
    setSettings((s) => ({ ...s, [section]: { ...(s[section] || {}), [key]: value } }));

  const setBank = (which, key, value) =>
    setSettings((s) => ({
      ...s,
      bankAccounts: {
        ...(s.bankAccounts || {}),
        [which]: { ...((s.bankAccounts || {})[which] || {}), [key]: value }
      }
    }));

  const saveAll = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      ui.showToast('Configuración guardada');
    } catch { ui.showToast('Error al guardar'); } finally { setSaving(false); }
  };

  if (!settings) return <p>Cargando…</p>;

  const general = settings.storeGeneral || {};
  const shipping = settings.shipping || {};
  const social = settings.social || {};
  const seo = settings.seo || {};
  const bankAccounts = settings.bankAccounts || {};
  const nequi = bankAccounts.nequi || { account: '', holder: '' };
  const bancolombia = bankAccounts.bancolombia || { account: '', holder: '' };

  return (
    <div>
      <h1 className="admin-title">Configuración</h1>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Tienda</h3>
        <div className="form-grid">
          <div className="afield"><label>Nombre</label><input value={general.name || ''} onChange={(e) => set('storeGeneral', 'name', e.target.value)} /></div>
          <div className="afield"><label>Email</label><input value={general.email || ''} onChange={(e) => set('storeGeneral', 'email', e.target.value)} /></div>
          <div className="afield"><label>Teléfono</label><input value={general.phone || ''} onChange={(e) => set('storeGeneral', 'phone', e.target.value)} /></div>
          <div className="afield"><label>WhatsApp</label><input value={general.whatsapp || ''} onChange={(e) => set('storeGeneral', 'whatsapp', e.target.value)} /></div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Cuentas de pago manual (Nequi / Bancolombia)</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Esta información se muestra al cliente en la página de éxito del checkout. El cliente realiza la transferencia
          y sube la captura del comprobante para que un admin la apruebe.
        </p>
        <div className="form-grid">
          <div className="afield">
            <label>Nequi — Titular</label>
            <input value={nequi.holder || ''} onChange={(e) => setBank('nequi', 'holder', e.target.value)} placeholder="Nombre del titular" />
          </div>
          <div className="afield">
            <label>Nequi — Número / Celular</label>
            <input value={nequi.account || ''} onChange={(e) => setBank('nequi', 'account', e.target.value)} placeholder="3001234567" />
          </div>
          <div className="afield">
            <label>Bancolombia — Titular</label>
            <input value={bancolombia.holder || ''} onChange={(e) => setBank('bancolombia', 'holder', e.target.value)} placeholder="Nombre del titular" />
          </div>
          <div className="afield">
            <label>Bancolombia — Número de cuenta</label>
            <input value={bancolombia.account || ''} onChange={(e) => setBank('bancolombia', 'account', e.target.value)} placeholder="12345678901" />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Envíos</h3>
        <div className="form-grid">
          <div className="afield"><label>Envío gratis desde (COP)</label><input type="number" value={shipping.freeShippingThreshold || ''} onChange={(e) => set('shipping', 'freeShippingThreshold', Number(e.target.value) || 0)} /></div>
          <div className="afield"><label>Métodos (JSON: [{'{id,name,description,cost}'}])</label>
            <textarea value={JSON.stringify(shipping.methods || [], null, 1)} onChange={(e) => {
              try { set('shipping', 'methods', JSON.parse(e.target.value)); } catch {}
            }} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Redes</h3>
        <div className="form-grid">
          <div className="afield"><label>Instagram</label><input value={social.instagram || ''} onChange={(e) => set('social', 'instagram', e.target.value)} /></div>
          <div className="afield"><label>TikTok</label><input value={social.tiktok || ''} onChange={(e) => set('social', 'tiktok', e.target.value)} /></div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>SEO</h3>
        <div className="form-grid">
          <div className="afield"><label>Título</label><input value={seo.title || ''} onChange={(e) => set('seo', 'title', e.target.value)} /></div>
          <div className="afield"><label>Descripción</label><input value={seo.description || ''} onChange={(e) => set('seo', 'description', e.target.value)} /></div>
        </div>
      </div>

      <button className="btn lime" onClick={saveAll} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </div>
  );
}
