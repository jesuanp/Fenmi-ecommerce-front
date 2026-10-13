import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero (banner principal)' },
  { value: 'feature', label: 'Características' },
  { value: 'category', label: 'Categorías' },
  { value: 'testimonial', label: 'Testimonios' },
  { value: 'banner', label: 'Banner' },
  { value: 'text', label: 'Bloque de texto' }
];

export default function AdminSettingsPage() {
  const ui = useUI();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBlockImage, setUploadingBlockImage] = useState(false);

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

  const setPolicy = (key, value) =>
    setSettings((s) => ({ ...s, policies: { ...(s.policies || {}), [key]: value } }));

  const setFooter = (key, value) =>
    setSettings((s) => ({ ...s, footer: { ...(s.footer || {}), [key]: value } }));

  const setBlocks = (blocks) =>
    setSettings((s) => ({ ...s, home: { ...(s.home || {}), blocks } }));

  const setBlock = (idx, patch) =>
    setBlocks((settings?.home?.blocks || []).map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  const addBlock = () =>
    setBlocks([...(settings?.home?.blocks || []), { type: 'feature', title: '', eyebrow: '', cta: { label: '', href: '' }, text: '', image: '', params: {} }]);

  const removeBlock = (idx) =>
    setBlocks((settings?.home?.blocks || []).filter((_, i) => i !== idx));

  const moveBlock = (idx, delta) => {
    const arr = [...(settings?.home?.blocks || [])];
    const target = idx + delta;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setBlocks(arr);
  };

  const setFooterLinks = (links) => setFooter('links', links);
  const addFooterLink = () => setFooterLinks([...(settings?.footer?.links || []), { label: '', url: '' }]);
  const removeFooterLink = (idx) =>
    setFooterLinks((settings?.footer?.links || []).filter((_, i) => i !== idx));
  const setFooterLink = (idx, patch) =>
    setFooterLinks((settings?.footer?.links || []).map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const saveAll = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      ui.showToast('Configuración guardada');
    } catch { ui.showToast('Error al guardar'); } finally { setSaving(false); }
  };

  const handleHeroUpload = async (field, file) => {
    setUploadingHero(true);
    try {
      const result = await adminApi.uploadHero({
        hero: field === 'hero' ? file : null,
        heroVertical: field === 'heroVertical' ? file : null
      });
      set('home', field === 'hero' ? 'heroImage' : 'heroImageVertical',
        field === 'hero' ? result.heroUrl : result.heroVerticalUrl);
      ui.showToast('Imagen subida');
    } catch {
      ui.showToast('Error al subir imagen');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleBlockImageUpload = async (idx, file) => {
    setUploadingBlockImage(true);
    try {
      const result = await adminApi.uploadHero({ hero: file });
      setBlock(idx, { image: result.heroUrl });
      ui.showToast('Imagen subida');
    } catch {
      ui.showToast('Error al subir imagen');
    } finally {
      setUploadingBlockImage(false);
    }
  };

  if (!settings) return <p>Cargando…</p>;

  const general = settings.storeGeneral || {};
  const shipping = settings.shipping || {};
  const social = settings.social || {};
  const seo = settings.seo || {};
  const bankAccounts = settings.bankAccounts || {};
  const nequi = bankAccounts.nequi || { account: '', holder: '' };
  const bancolombia = bankAccounts.bancolombia || { account: '', holder: '' };
  const policies = settings.policies || {};
  const footer = settings.footer || {};
  const blocks = settings.home?.blocks || [];

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
        <h3 style={{ marginBottom: 12 }}>Portada (Hero)</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Sube las imágenes del banner principal de la página de inicio. Se muestran en desktop y mobile.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Imagen desktop</p>
            {settings.home?.heroImage && (
              <img
                src={settings.home.heroImage}
                alt="Imagen principal de escritorio"
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
              />
            )}
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
              {uploadingHero ? 'Subiendo…' : (settings.home?.heroImage ? 'Cambiar desktop' : 'Subir desktop')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) handleHeroUpload('hero', e.target.files[0]); }}
                disabled={uploadingHero}
              />
            </label>
          </div>
          <div>
            <p style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Imagen mobile</p>
            {settings.home?.heroImageVertical && (
              <img
                src={settings.home.heroImageVertical}
                alt="Imagen principal de móvil"
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
              />
            )}
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
              {uploadingHero ? 'Subiendo…' : (settings.home?.heroImageVertical ? 'Cambiar mobile' : 'Subir mobile')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) handleHeroUpload('heroVertical', e.target.files[0]); }}
                disabled={uploadingHero}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Bloques del Home</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Cada bloque define una sección de la portada. Puedes reordenarlos, agregar o eliminar. La imagen se
          sube al servidor de la tienda.
        </p>
        {blocks.length === 0 && <p style={{ color: 'var(--mid)', fontSize: 13 }}>No hay bloques definidos.</p>}
        {blocks.map((b, idx) => (
          <div key={idx} style={{ border: '1px solid var(--line, #eee)', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13 }}>Bloque #{idx + 1}</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-sm" type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}>↑</button>
                <button className="btn-sm" type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}>↓</button>
                <button className="btn-sm" type="button" onClick={() => removeBlock(idx)} style={{ color: 'var(--danger)' }}>Eliminar</button>
              </div>
            </div>
            <div className="form-grid">
              <div className="afield">
                <label>Tipo</label>
                <select value={b.type || 'feature'} onChange={(e) => setBlock(idx, { type: e.target.value })}>
                  {BLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="afield">
                <label>Título</label>
                <input value={b.title || ''} onChange={(e) => setBlock(idx, { title: e.target.value })} />
              </div>
              <div className="afield">
                <label>Etiqueta superior</label>
                <input value={b.eyebrow || ''} onChange={(e) => setBlock(idx, { eyebrow: e.target.value })} />
              </div>
              <div className="afield">
                <label>Texto</label>
                <textarea rows={2} value={b.text || ''} onChange={(e) => setBlock(idx, { text: e.target.value })} />
              </div>
              <div className="afield">
                <label>CTA — Etiqueta</label>
                <input
                  value={b.cta?.label || ''}
                  onChange={(e) => setBlock(idx, { cta: { ...(b.cta || {}), label: e.target.value } })}
                  placeholder="Ej. Ver catálogo"
                />
              </div>
              <div className="afield">
                <label>CTA — URL</label>
                <input
                  value={b.cta?.href || ''}
                  onChange={(e) => setBlock(idx, { cta: { ...(b.cta || {}), href: e.target.value } })}
                  placeholder="/catalog"
                />
              </div>
              <div className="afield" style={{ gridColumn: '1 / -1' }}>
                <label>Imagen</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {b.image && (
                    <img
                      src={b.image}
                      alt=""
                      style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 4 }}
                    />
                  )}
                  <label className="btn-sm" style={{ cursor: 'pointer' }}>
                    {uploadingBlockImage ? 'Subiendo…' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files[0]) handleBlockImageUpload(idx, e.target.files[0]); }}
                      disabled={uploadingBlockImage}
                    />
                  </label>
                  {b.image && (
                    <button type="button" className="btn-sm" onClick={() => setBlock(idx, { image: '' })}>Quitar</button>
                  )}
                </div>
              </div>
              <div className="afield" style={{ gridColumn: '1 / -1' }}>
                <label>Parámetros extra (JSON libre)</label>
                <textarea
                  rows={2}
                  value={b.params ? JSON.stringify(b.params, null, 1) : '{}'}
                  onChange={(e) => {
                    try { setBlock(idx, { params: JSON.parse(e.target.value) }); } catch {}
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <button className="btn outline small" type="button" onClick={addBlock}>+ Agregar bloque</button>
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
        <h3 style={{ marginBottom: 12 }}>Políticas</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Estos textos se muestran en la página de políticas. Puedes usar saltos de línea.
        </p>
        <div className="form-grid">
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <label>Política de privacidad</label>
            <textarea rows={4} value={policies.privacy || ''} onChange={(e) => setPolicy('privacy', e.target.value)} />
          </div>
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <label>Términos y condiciones</label>
            <textarea rows={4} value={policies.terms || ''} onChange={(e) => setPolicy('terms', e.target.value)} />
          </div>
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <label>Política de devoluciones</label>
            <textarea rows={4} value={policies.refunds || ''} onChange={(e) => setPolicy('refunds', e.target.value)} />
          </div>
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <label>Política de envíos</label>
            <textarea rows={4} value={policies.shipping || ''} onChange={(e) => setPolicy('shipping', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Pie de página</h3>
        <div className="form-grid">
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <label>Texto "Acerca de"</label>
            <textarea rows={3} value={footer.about || ''} onChange={(e) => setFooter('about', e.target.value)} placeholder="Una o dos frases sobre la marca." />
          </div>
          <div className="afield">
            <label>Copyright</label>
            <input value={footer.copyright || ''} onChange={(e) => setFooter('copyright', e.target.value)} placeholder="© 2026 FENMI" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 8 }}>Links del footer</p>
          {(footer.links || []).map((l, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
              <input
                value={l.label || ''}
                onChange={(e) => setFooterLink(idx, { label: e.target.value })}
                placeholder="Etiqueta (ej. Políticas)"
              />
              <input
                value={l.url || ''}
                onChange={(e) => setFooterLink(idx, { url: e.target.value })}
                placeholder="/policies"
              />
              <button type="button" className="btn-sm" onClick={() => removeFooterLink(idx)} style={{ color: 'var(--danger)' }}>Quitar</button>
            </div>
          ))}
          <button className="btn outline small" type="button" onClick={addFooterLink}>+ Agregar link</button>
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
