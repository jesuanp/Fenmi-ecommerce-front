import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Save } from 'lucide-react';
import AdminIcon from '@/components/admin/AdminIcon';
import { ADMIN_SETTINGS_SECTIONS, getAdminSettingsSection } from '@/data/adminSettings';
import { buildAdminSettingsUpdate, hasAdminSettingsChanges } from '@/utils/adminSettingsPayload';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { MAX_IMAGE_MB, getImageUploadError, prepareImageForUpload, validateImageFile } from '@/utils/imageUpload';
import ColombiaShippingAdmin from '@/components/ColombiaShippingAdmin';

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
  const location = useLocation();
  const sectionId = location.pathname.split('/')[3] || '';
  const section = getAdminSettingsSection(sectionId);
  const [settings, setSettings] = useState(null);
  const baseline = useRef(null);
  const [saving, setSaving] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBlockImage, setUploadingBlockImage] = useState(false);

  const loadSettings = async () => {
    setLoadingError('');
    try {
      const result = await adminApi.getSettings();
      setSettings(result);
      baseline.current = result;
    } catch {
      setLoadingError('No se pudo cargar la configuración. Revisa la conexión e inténtalo nuevamente.');
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const set = (sectionName, key, value) =>
    setSettings((current) => ({ ...current, [sectionName]: { ...(current[sectionName] || {}), [key]: value } }));

  const setBank = (which, key, value) =>
    setSettings((current) => ({
      ...current,
      bankAccounts: {
        ...(current.bankAccounts || {}),
        [which]: { ...((current.bankAccounts || {})[which] || {}), [key]: value }
      }
    }));

  const setPolicy = (key, value) => set('policies', key, value);
  const setFooter = (key, value) => set('footer', key, value);

  const setBlocks = (nextBlocks) =>
    setSettings((current) => ({
      ...current,
      home: {
        ...(current.home || {}),
        blocks: typeof nextBlocks === 'function' ? nextBlocks(current.home?.blocks || []) : nextBlocks
      }
    }));

  const setBlock = (idx, patch) =>
    setBlocks((blocks) => blocks.map((block, i) => (i === idx ? { ...block, ...patch } : block)));
  const addBlock = () =>
    setBlocks((blocks) => [...blocks, { type: 'feature', title: '', eyebrow: '', cta: { label: '', href: '' }, text: '', image: '', params: {} }]);
  const removeBlock = (idx) => setBlocks((blocks) => blocks.filter((_, i) => i !== idx));
  const moveBlock = (idx, delta) => setBlocks((blocks) => {
    const copy = [...blocks];
    const target = idx + delta;
    if (target >= 0 && target < copy.length) [copy[idx], copy[target]] = [copy[target], copy[idx]];
    return copy;
  });

  const setFooterLinks = (links) => setFooter('links', links);
  const addFooterLink = () =>
    setSettings((current) => ({ ...current, footer: { ...(current.footer || {}), links: [...(current.footer?.links || []), { label: '', url: '' }] } }));
  const removeFooterLink = (idx) =>
    setSettings((current) => ({ ...current, footer: { ...(current.footer || {}), links: (current.footer?.links || []).filter((_, i) => i !== idx) } }));
  const setFooterLink = (idx, patch) =>
    setSettings((current) => ({ ...current, footer: { ...(current.footer || {}), links: (current.footer?.links || []).map((item, i) => i === idx ? { ...item, ...patch } : item) } }));

  const saveCurrentSection = async () => {
    if (!section || !settings || saving || uploadingHero || uploadingBlockImage) return;
    setSaving(true);
    try {
      const currentServer = section.key === 'home' ? await adminApi.getSettings() : {};
      const payload = buildAdminSettingsUpdate(section, settings, currentServer);
      await adminApi.updateSettings(payload);
      baseline.current = { ...(baseline.current || {}), ...payload };
      ui.showToast(`${section.label} guardado correctamente`);
    } catch (error) {
      ui.showToast(error.response?.data?.error?.message || 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleHeroUpload = async (field, file) => {
    const error = validateImageFile(file);
    if (error) return ui.showToast(error);
    setUploadingHero(true);
    try {
      const prepared = await prepareImageForUpload(file, field === 'hero'
        ? { maxWidth: 1920, maxHeight: 1200 }
        : { maxWidth: 1080, maxHeight: 1920 });
      const result = await adminApi.uploadHero({
        hero: field === 'hero' ? prepared : null,
        heroVertical: field === 'heroVertical' ? prepared : null
      });
      set('home', field === 'hero' ? 'heroImage' : 'heroImageVertical',
        field === 'hero' ? result.heroUrl : result.heroVerticalUrl);
      ui.showToast('Imagen subida y optimizada. Guarda los cambios para publicarla.');
    } catch (error) {
      ui.showToast(getImageUploadError(error));
    } finally {
      setUploadingHero(false);
    }
  };

  const handleBlockImageUpload = async (idx, file) => {
    const error = validateImageFile(file);
    if (error) return ui.showToast(error);
    setUploadingBlockImage(true);
    try {
      const prepared = await prepareImageForUpload(file, { maxWidth: 1600, maxHeight: 1100 });
      const result = await adminApi.uploadHero({ hero: prepared });
      setBlock(idx, { image: result.heroUrl });
      ui.showToast('Imagen subida. Guarda los cambios para publicarla.');
    } catch (error) {
      ui.showToast(getImageUploadError(error));
    } finally {
      setUploadingBlockImage(false);
    }
  };

  if (loadingError) return (
    <div className="admin-empty-state" role="alert">
      <CircleAlert size={28} />
      <h2>No se pudo abrir la configuración</h2>
      <p>{loadingError}</p>
      <button className="admin-button primary" type="button" onClick={loadSettings}>Volver a intentar</button>
    </div>
  );

  if (!settings) return <div className="admin-loading-state"><span className="admin-loading-indicator" />Cargando configuración…</div>;

  if (!section) return (
    <div className="admin-settings-index">
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow">AJUSTES DE TU NEGOCIO</div><h1 className="admin-title">Configuración</h1><p>Todo lo necesario para administrar tu tienda, organizado por áreas.</p></div>
      </div>
      <div className="admin-settings-intro">
        <div className="admin-settings-intro-icon"><AdminIcon name="settings" size={24} /></div>
        <div><strong>Un lugar para cada ajuste</strong><p>Abre una sección, haz los cambios y guárdalos sin modificar las demás áreas.</p></div>
      </div>
      <div className="admin-settings-grid">
        {ADMIN_SETTINGS_SECTIONS.map((item) => (
          <Link to={`/admin/settings/${item.id}`} key={item.id} className="admin-settings-tile">
            <span className="admin-settings-tile-icon"><AdminIcon name={item.icon} size={22} /></span>
            <div className="admin-settings-tile-content"><h2>{item.label}</h2><p>{item.description}</p></div>
            <ArrowRight className="admin-settings-tile-arrow" size={19} />
          </Link>
        ))}
      </div>
    </div>
  );

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
  const hasChanges = hasAdminSettingsChanges(section, settings, baseline.current);

  return (
    <div className="admin-settings-page">
      <div className="admin-page-heading admin-settings-page-heading">
        <div>
          <Link className="admin-back-link" to="/admin/settings"><ArrowLeft size={15} /> Todas las configuraciones</Link>
          <div className="admin-eyebrow">CONFIGURACIÓN / {section.shortLabel.toUpperCase()}</div>
          <h1 className="admin-title">{section.label}</h1>
          <p>{section.description}</p>
        </div>
        <span className="admin-settings-heading-icon"><AdminIcon name={section.icon} size={27} /></span>
      </div>

      <div className="admin-settings-editor">
      {section.id === 'general' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Información de contacto</h3>
        <div className="form-grid">
          <div className="afield"><label>Nombre</label><input value={general.name || ''} onChange={(e) => set('storeGeneral', 'name', e.target.value)} /></div>
          <div className="afield"><label>Email</label><input value={general.email || ''} onChange={(e) => set('storeGeneral', 'email', e.target.value)} /></div>
          <div className="afield"><label>Teléfono</label><input value={general.phone || ''} onChange={(e) => set('storeGeneral', 'phone', e.target.value)} /></div>
          <div className="afield"><label>WhatsApp</label><input value={general.whatsapp || ''} onChange={(e) => set('storeGeneral', 'whatsapp', e.target.value)} /></div>
        </div>
      </div>
      )}

      {section.id === 'portada' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Imágenes del banner principal</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Sube imágenes de hasta {MAX_IMAGE_MB} MB. Se optimizan antes de enviarlas y se muestran en escritorio y celular.
        </p>
        <div className="admin-hero-grid">
          <div>
            <p style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Imagen desktop</p>
            {settings.home?.heroImage && (
              <img
                src={settings.home.heroImage}
                alt="Imagen principal de escritorio"
                className="admin-hero-preview"
              />
            )}
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
              {uploadingHero ? 'Subiendo…' : (settings.home?.heroImage ? 'Cambiar desktop' : 'Subir desktop')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleHeroUpload('hero', file); }}
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
                className="admin-hero-preview"
              />
            )}
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
              {uploadingHero ? 'Subiendo…' : (settings.home?.heroImageVertical ? 'Cambiar mobile' : 'Subir mobile')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleHeroUpload('heroVertical', file); }}
                disabled={uploadingHero}
              />
            </label>
          </div>
        </div>
      </div>
      )}

      {section.id === 'bloques' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Secciones de la página de inicio</h3>
        <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 14 }}>
          Cada bloque define una sección de la portada. Puedes reordenarlos, agregar o eliminar. La imagen se
          sube al servidor de la tienda.
        </p>
        {blocks.length === 0 && <p style={{ color: 'var(--mid)', fontSize: 13 }}>No hay bloques definidos.</p>}
        {blocks.map((b, idx) => (
          <div key={idx} className="admin-block-card">
            <div className="admin-block-head">
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
                <label>Imagen (máximo {MAX_IMAGE_MB} MB)</label>
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
                      onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleBlockImageUpload(idx, file); }}
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
      )}

      {section.id === 'pagos' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Cuentas para transferencias manuales</h3>
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
      )}

      {section.id === 'envios' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Transportadoras y tarifas de entrega</h3>
        <div className="form-grid">
          <div className="afield"><label>Envío gratis desde (COP)</label><input type="number" value={shipping.freeShippingThreshold || ''} onChange={(e) => set('shipping', 'freeShippingThreshold', Number(e.target.value) || 0)} /></div>
          <div className="afield" style={{ gridColumn: '1 / -1' }}>
            <p className="checkout-note" role="status">Para configurar el envío, selecciona cada transportadora y agrega tarifas en COP por departamento o por ciudad usando las listas. Si no existe una tarifa específica, se aplica la del departamento o la tarifa de respaldo que configures. Sin una tarifa confirmada, el cliente no podrá iniciar el pago a domicilio.</p>
          </div>
        </div>
        <ColombiaShippingAdmin value={shipping.colombia} onChange={(next) => set('shipping', 'colombia', next)} />
      </div>
      )}

      {section.id === 'politicas' && (
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
      )}

      {section.id === 'footer' && (
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
            <div key={idx} className="admin-footer-link-row">
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
      )}

      {section.id === 'redes' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Perfiles sociales</h3>
        <div className="form-grid">
          <div className="afield"><label>Instagram</label><input value={social.instagram || ''} onChange={(e) => set('social', 'instagram', e.target.value)} /></div>
          <div className="afield"><label>TikTok</label><input value={social.tiktok || ''} onChange={(e) => set('social', 'tiktok', e.target.value)} /></div>
        </div>
      </div>
      )}

      {section.id === 'seo' && (
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Título y descripción para buscadores</h3>
        <div className="form-grid">
          <div className="afield"><label>Título</label><input value={seo.title || ''} onChange={(e) => set('seo', 'title', e.target.value)} /></div>
          <div className="afield"><label>Descripción</label><input value={seo.description || ''} onChange={(e) => set('seo', 'description', e.target.value)} /></div>
        </div>
      </div>
      )}

      </div>
      <div className="admin-settings-savebar">
        <div className="admin-settings-save-message">
          <span className={`admin-save-state${hasChanges ? ' is-dirty' : ''}`}><span />{hasChanges ? 'Cambios sin guardar' : 'Sección al día'}</span>
          <small>Solo se guarda esta sección. Los demás ajustes permanecen intactos.</small>
        </div>
        <button className="admin-button primary" type="button" onClick={saveCurrentSection} disabled={saving || uploadingHero || uploadingBlockImage || !hasChanges}>
          {hasChanges ? <Save size={17} /> : <Check size={17} />}
          {saving ? 'Guardando…' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </div>
    </div>
  );
}
