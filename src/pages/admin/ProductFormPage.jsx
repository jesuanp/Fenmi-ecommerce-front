import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import client from '@/services/api';
import useUI from '@/stores/ui';
import { MAX_IMAGE_MB, getImageUploadError, prepareImageForUpload, validateImageFile } from '@/utils/imageUpload';

const FIELD_LABELS = {
  name: 'Nombre',
  categoryId: 'Categoría',
  basePrice: 'Precio',
  compareAtPrice: 'Precio anterior',
  shortDescription: 'Descripción corta',
  longDescription: 'Descripción larga',
  fabricType: 'Tipo de tela',
  composition: 'Composición',
  careInstructions: 'Cuidado',
  shippingInfo: 'Envíos',
  returnInfo: 'Devoluciones',
  colorId: 'Color',
  sizeId: 'Talla',
  stock: 'Existencias',
  priceOverride: 'Precio de variante',
  tagIds: 'Etiquetas'
};

function describeError(err, fallback = 'Error al guardar') {
  const e = err?.response?.data?.error;
  if (!err) return fallback;
  if (!e) return err.message || fallback;
  const raw = Array.isArray(e.details) ? e.details : [];
  if (!raw.length) return e.message || fallback;
  const lineas = raw.map((d) => {
    const p = Array.isArray(d.path) ? d.path.join('.') : (d.field || d.path || '');
    const [root, idx] = String(p).split('.');
    const etiqueta = FIELD_LABELS[root] || root;
    return idx !== undefined ? `${etiqueta} (variante ${Number(idx) + 1})` : etiqueta;
  });
  const unicas = [...new Set(lineas)];
  return `${e.message} → ${unicas.join(', ')}`;
}

const EMPTY = {
  name: '', categoryId: '', shortDescription: '', longDescription: '',
  fabricType: '', composition: '', careInstructions: '', shippingInfo: '', returnInfo: '',
  basePrice: '', compareAtPrice: '', featured: false, isNew: false, bestSeller: false,
  active: true
};

export default function ProductFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const ui = useUI();
  const editing = !!id;

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadColorId, setUploadColorId] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#333333');
  const [creatingColor, setCreatingColor] = useState(false);
  const [loading, setLoading] = useState(editing);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    adminApi.listCategories().then((cs) => setCategories(cs));
    adminApi.listTags().then((ts) => setTags(ts));
    client.get('/meta').then((r) => {
      setColors(r.data.data.colors || []);
      setSizes(r.data.data.sizes || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editing) return;
    adminApi
      .getProduct(id)
      .then((p) => {
        setForm({
          name: p.name, categoryId: p.category?.id || '',
          shortDescription: p.shortDescription || '', longDescription: p.longDescription || '',
          fabricType: p.fabricType || '', composition: p.composition || '',
          careInstructions: p.careInstructions || '', shippingInfo: p.shippingInfo || '',
          returnInfo: p.returnInfo || '', basePrice: p.basePrice, compareAtPrice: p.compareAtPrice || '',
          featured: p.featured, isNew: p.isNew, bestSeller: p.bestSeller, active: p.active
        });
        setVariants((p.variants || []).map((v) => ({ colorId: v.colorId, sizeId: v.sizeId, stock: v.stock, priceOverride: v.priceOverride || '', active: v.active })));
        setImages(p.images || []);
        setTagIds((p.terms || []).map((t) => t.id));
      })
      .catch((err) => ui.showToast(describeError(err, 'No se pudo cargar el producto')))
      .finally(() => setLoading(false));
  }, [editing]);

  const save = async (e) => {
    e.preventDefault();
    const incompletas = variants.filter((v) => !v.colorId || !v.sizeId).length;
    if (incompletas > 0) {
      return ui.showToast(`Hay ${incompletas} variante(s) sin color o talla. Complétalas o elimínalas antes de guardar.`);
    }
    const variantPairs = variants.map((v) => `${v.colorId}-${v.sizeId}`);
    if (new Set(variantPairs).size !== variantPairs.length) {
      ui.showToast('No se puede repetir la misma combinación de color y talla.');
      return;
    }
    const payload = {
      name: form.name,
      categoryId: Number(form.categoryId),
      shortDescription: form.shortDescription || null,
      longDescription: form.longDescription || null,
      fabricType: form.fabricType || null,
      composition: form.composition || null,
      careInstructions: form.careInstructions || null,
      shippingInfo: form.shippingInfo || null,
      returnInfo: form.returnInfo || null,
      basePrice: Number(form.basePrice),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      featured: !!form.featured,
      isNew: !!form.isNew,
      bestSeller: !!form.bestSeller,
      active: form.active !== false,
      variants: variants.map((v) => ({
        colorId: Number(v.colorId),
        sizeId: Number(v.sizeId),
        stock: Number(v.stock) || 0,
        priceOverride: v.priceOverride === '' || v.priceOverride == null ? null : Number(v.priceOverride),
        active: v.active !== false
      })),
      tagIds
    };
    try {
      if (editing) {
        await adminApi.updateProduct(id, payload);
        ui.showToast('Producto actualizado');
      } else {
        const created = await adminApi.createProduct(payload);
        ui.showToast('Producto creado');
        nav(`/admin/products/${created.id}/edit`);
        return;
      }
      nav('/admin/products');
    } catch (err) {
      ui.showToast(describeError(err));
    }
  };

  const addVariantRow = () => setVariants((v) => [...v, { colorId: '', sizeId: '', stock: 0, priceOverride: '', active: true }]);
  const setVariant = (idx, k, val) => setVariants((vs) => vs.map((v, i) => (i === idx ? { ...v, [k]: val } : v)));
  const delVariant = (idx) => setVariants((vs) => vs.filter((_, i) => i !== idx));

  const createColor = async () => {
    if (newColorName.trim().length < 2) {
      ui.showToast('Escribe un nombre de color de al menos dos caracteres.');
      return;
    }
    setCreatingColor(true);
    try {
      const color = await adminApi.createColor({ name: newColorName.trim(), hex: newColorHex });
      setColors((existing) => [...existing, color].sort((a, b) => a.name.localeCompare(b.name)));
      setVariants((current) => [...current, { colorId: String(color.id), sizeId: '', stock: 0, priceOverride: '', active: true }]);
      setUploadColorId(String(color.id));
      setNewColorName('');
      ui.showToast(`Color ${color.name} creado. Completa su talla y existencias y guarda el producto.`);
    } catch (error) {
      ui.showToast(error.response?.data?.error?.message || 'No se pudo crear el color.');
    } finally {
      setCreatingColor(false);
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const error = validateImageFile(file);
    if (error) {
      ui.showToast(error);
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const prepared = await prepareImageForUpload(file, { maxWidth: 1500, maxHeight: 1800 });
      const img = await adminApi.uploadImage(id, prepared, uploadColorId || null);
      setImages((imgs) => [...imgs, img]);
      ui.showToast('Imagen subida y optimizada.');
    } catch (error) {
      ui.showToast(getImageUploadError(error));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      <div className="admin-top">
        <h1 className="admin-title">{editing ? 'Editar producto' : 'Nuevo producto'}</h1>
        <Link className="btn-sm" to="/admin/products">← Volver</Link>
      </div>

      <form onSubmit={save}>
        <div className="admin-card">
          <h3 style={{ marginBottom: 14 }}>Información básica</h3>
          <div className="form-grid">
            <div className="afield full"><label>Nombre *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div className="afield"><label>Categoría</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="afield"><label>Precio (COP) *</label><input type="number" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} required /></div>
            <div className="afield"><label>Precio anterior (descuento)</label><input type="number" value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} /></div>
            <div className="afield full"><label>Descripción corta</label><input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} /></div>
            <div className="afield full"><label>Descripción larga</label><textarea value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} /></div>
            <div className="afield"><label>Tipo de tela</label><input value={form.fabricType} onChange={(e) => set('fabricType', e.target.value)} /></div>
            <div className="afield"><label>Composición</label><input value={form.composition} onChange={(e) => set('composition', e.target.value)} /></div>
            <div className="afield full"><label>Cuidado</label><textarea value={form.careInstructions} onChange={(e) => set('careInstructions', e.target.value)} /></div>
            <div className="afield full"><label>Envíos</label><textarea value={form.shippingInfo} onChange={(e) => set('shippingInfo', e.target.value)} /></div>
            <div className="afield full"><label>Devoluciones</label><textarea value={form.returnInfo} onChange={(e) => set('returnInfo', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
            <label className="check-row"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Destacado</label>
            <label className="check-row"><input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} /> Nuevo</label>
            <label className="check-row"><input type="checkbox" checked={form.bestSeller} onChange={(e) => set('bestSeller', e.target.checked)} /> Más vendido</label>
            <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Activo</label>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ marginBottom: 14 }}>Variantes (color × talla + stock)</h3>
          {variants.map((v, i) => (
            <div className="variant-row" key={i}>
              <select value={v.colorId} onChange={(e) => setVariant(i, 'colorId', e.target.value)}>
                <option value="">Color…</option>
                {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={v.sizeId} onChange={(e) => setVariant(i, 'sizeId', e.target.value)}>
                <option value="">Talla…</option>
                {sizes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <input type="number" min="0" placeholder="Existencias" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} />
              <input type="number" placeholder="Precio (opc.)" value={v.priceOverride} onChange={(e) => setVariant(i, 'priceOverride', e.target.value)} />
              <button type="button" className="btn-sm danger" onClick={() => delVariant(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-sm" onClick={addVariantRow}>+ Agregar variante</button>
          <div className="admin-color-creator">
            <div>
              <h4>Crear un color nuevo</h4>
              <p>Agrega un color que no esté en la lista. Después indica la talla y las existencias de esa variante.</p>
            </div>
            <div className="admin-color-creator-fields">
              <label className="afield">
                <span>Nombre del color</span>
                <input value={newColorName} maxLength={80} placeholder="Ej. Azul marino" onChange={(e) => setNewColorName(e.target.value)} />
              </label>
              <label className="afield admin-color-hex">
                <span>Tonalidad</span>
                <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} aria-label="Elegir tonalidad" />
              </label>
              <button type="button" className="btn-sm" disabled={creatingColor || !newColorName.trim()} onClick={createColor}>
                {creatingColor ? 'Creando…' : '+ Crear color'}
              </button>
            </div>
            <div className="admin-colors-preview" aria-label="Colores disponibles">
              {colors.map((color) => (
                <span key={color.id} className="admin-color-chip" title={color.name}>
                  <i style={{ backgroundColor: color.hex || '#cccccc' }} />{color.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ marginBottom: 14 }}>Etiquetas</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {tags.map((t) => (
              <label key={t.id} className="check-row">
                <input type="checkbox" checked={tagIds.includes(t.id)} onChange={() => setTagIds((ids) => (ids.includes(t.id) ? ids.filter((x) => x !== t.id) : [...ids, t.id]))} />
                {t.name}
              </label>
            ))}
          </div>
        </div>

        {editing && (
          <div className="admin-card">
            <h3 style={{ marginBottom: 14 }}>Imágenes ({images.length})</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {images.slice().sort((a, b) => a.position - b.position).map((img) => (
                <div key={img.id} style={{ position: 'relative', width: 80 }}>
                  <img src={img.url} alt="" loading="lazy" decoding="async" style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                  {img.colorId || img.color_id ? (
                    <small className="admin-image-color">{colors.find((c) => String(c.id) === String(img.colorId || img.color_id))?.name || 'Color'}</small>
                  ) : null}
                  <button
                    type="button"
                    className="btn-sm danger"
                    style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px' }}
                    onClick={async () => { await adminApi.deleteImage(img.id); setImages((imgs) => imgs.filter((x) => x.id !== img.id)); }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="admin-upload-fields">
              <label className="afield">
                <span>Fotografía de un color (opcional)</span>
                <select value={uploadColorId} onChange={(e) => setUploadColorId(e.target.value)}>
                  <option value="">General · todos los colores</option>
                  {[...new Set(variants.map((v) => String(v.colorId)).filter(Boolean))].map((colorId) => {
                    const color = colors.find((c) => String(c.id) === colorId);
                    return color ? <option value={colorId} key={colorId}>{color.name}</option> : null;
                  })}
                </select>
              </label>
              <label className="afield">
                <span>Subir imagen (máximo {MAX_IMAGE_MB} MB)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} />
              </label>
            </div>
            <p className="admin-upload-hint">Las nuevas imágenes se comprimen automáticamente. Para fotografías por color, guarda primero las variantes del producto.</p>
            {uploading && <span style={{ fontSize: 12, color: 'var(--mid)' }}> Subiendo…</span>}
          </div>
        )}

        <button className="btn lime" type="submit">
          {editing ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </form>
    </div>
  );
}