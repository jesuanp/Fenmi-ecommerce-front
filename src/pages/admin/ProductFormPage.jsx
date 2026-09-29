import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import client from '@/services/api';
import useUI from '@/stores/ui';

const EMPTY = {
  name: '', categoryId: '', sku: '', shortDescription: '', longDescription: '',
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
    if (editing) {
      adminApi.getProduct(id).then((p) => {
        setForm({
          name: p.name, categoryId: p.category?.id || '', sku: p.sku || '',
          shortDescription: p.shortDescription || '', longDescription: p.longDescription || '',
          fabricType: p.fabricType || '', composition: p.composition || '',
          careInstructions: p.careInstructions || '', shippingInfo: p.shippingInfo || '',
          returnInfo: p.returnInfo || '', basePrice: p.basePrice, compareAtPrice: p.compareAtPrice || '',
          featured: p.featured, isNew: p.isNew, bestSeller: p.bestSeller, active: p.active
        });
        setVariants(p.variants.map((v) => ({ colorId: v.colorId, sizeId: v.sizeId, sku: v.sku || '', stock: v.stock, priceOverride: v.priceOverride || '', active: v.active })));
        setImages(p.images || []);
        setTagIds(p.terms.map((t) => t.id));
        setLoading(false);
      });
    }
  }, [editing]);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      categoryId: Number(form.categoryId),
      sku: form.sku || null,
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
      variants: variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
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
      ui.showToast(err.response?.data?.error?.message || 'Error al guardar');
    }
  };

  const addVariantRow = () => setVariants((v) => [...v, { colorId: '', sizeId: '', sku: '', stock: 0, priceOverride: '', active: true }]);
  const setVariant = (idx, k, val) => setVariants((vs) => vs.map((v, i) => (i === idx ? { ...v, [k]: val } : v)));
  const delVariant = (idx) => setVariants((vs) => vs.filter((_, i) => i !== idx));

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const img = await adminApi.uploadImage(id, file);
      setImages((imgs) => [...imgs, img]);
      ui.showToast('Imagen subida');
    } catch {
      ui.showToast('No se pudo subir la imagen');
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
            <div className="afield"><label>SKU</label><input value={form.sku} onChange={(e) => set('sku', e.target.value)} /></div>
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
              <input placeholder="SKU" value={v.sku} onChange={(e) => setVariant(i, 'sku', e.target.value)} />
              <input type="number" min="0" placeholder="Stock" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} />
              <input type="number" placeholder="Precio (opc.)" value={v.priceOverride} onChange={(e) => setVariant(i, 'priceOverride', e.target.value)} />
              <button type="button" className="btn-sm danger" onClick={() => delVariant(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-sm" onClick={addVariantRow}>+ Agregar variante</button>
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
              {images.sort((a, b) => a.position - b.position).map((img) => (
                <div key={img.id} style={{ position: 'relative', width: 80 }}>
                  <img src={img.url} alt="" style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 8 }} />
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
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} />
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