import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

export default function AdminCategoriesPage() {
  const ui = useUI();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', active: true, imageUrl: '' });
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => adminApi.listCategories().then(setItems);
  useEffect(() => { load(); }, []);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await adminApi.uploadCategoryImage(file);
      setForm((f) => ({ ...f, imageUrl: result.url }));
      ui.showToast('Imagen subida');
    } catch {
      ui.showToast('No se pudo subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, imageUrl: '' }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) await adminApi.updateCategory(editId, form);
      else await adminApi.createCategory(form);
      ui.showToast('Guardado');
      setForm({ name: '', description: '', active: true, imageUrl: '' });
      setEditId(null);
      load();
    } catch (err) { ui.showToast(err.response?.data?.error?.message || 'Error'); }
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description || '', active: c.active, position: c.position, imageUrl: c.image_url || '' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ name: '', description: '', active: true, imageUrl: '' });
  };

  return (
    <div>
      <h1 className="admin-title">Categorías</h1>
      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: 12 }}>{editId ? 'Editar' : 'Nueva'} categoría</h3>
        <form className="form-grid" onSubmit={save}>
          <div className="afield"><label>Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="afield"><label>Posición</label><input type="number" value={form.position || 0} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
          <div className="afield full"><label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

          <div className="afield full">
            <label>Imagen</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {form.imageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={form.imageUrl} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                  <button
                    type="button"
                    onClick={clearImage}
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{ width: 96, height: 96, borderRadius: 6, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', color: 'var(--light)', fontSize: 12, textAlign: 'center', padding: 8 }}
                >
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={uploadImage} />
            </div>
          </div>

          <div className="full" style={{ display: 'flex', gap: 10 }}>
            <button className="btn lime small" type="submit">{editId ? 'Guardar' : 'Crear'}</button>
            {editId && <button type="button" className="btn-sm" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Imagen</th><th>Nombre</th><th>Slug</th><th>Productos</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.image_url ? (
                    <img src={c.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 4, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--light)', fontSize: 10 }}>Sin img</div>
                  )}
                </td>
                <td><strong>{c.name}</strong></td>
                <td style={{ color: 'var(--light)' }}>{c.slug}</td>
                <td>{c.products?.length || 0}</td>
                <td><span className={'status-badge ' + (c.active ? 'active' : 'cancelled')}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                <td className="admin-actions">
                  <button className="btn-sm" onClick={() => startEdit(c)}>Editar</button>
                  <button className="btn-sm danger" onClick={async () => {
                    if (!window.confirm(`¿Eliminar "${c.name}"?`)) return;
                    try { await adminApi.deleteCategory(c.id); ui.showToast('Eliminada'); load(); } catch { ui.showToast('No se puede eliminar'); }
                  }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
