import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

export default function AdminTagsPage() {
  const ui = useUI();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);

  const load = () => adminApi.listTags().then(setItems);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editId) await adminApi.updateTag(editId, { name });
      else await adminApi.createTag({ name });
      ui.showToast('Guardado');
      setName('');
      setEditId(null);
      load();
    } catch { ui.showToast('Error al guardar'); }
  };

  return (
    <div>
      <h1 className="admin-title">Etiquetas</h1>
      <div className="admin-card" style={{ maxWidth: 440 }}>
        <form className="form-grid" onSubmit={save}>
          <div className="afield"><label>{editId ? 'Editar' : 'Nueva'} etiqueta</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="NEW, BEST SELLER…" required /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <button className="btn lime small" type="submit">{editId ? 'Guardar' : 'Crear'}</button>
            {editId && <button type="button" className="btn-sm" onClick={() => { setEditId(null); setName(''); }}>Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>Slug</th><th>Productos</th><th></th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong></td>
                <td style={{ color: 'var(--light)' }}>{t.slug}</td>
                <td>{t.products?.length || 0}</td>
                <td className="admin-actions">
                  <button className="btn-sm" onClick={() => { setEditId(t.id); setName(t.name); }}>Editar</button>
                  <button className="btn-sm danger" onClick={async () => {
                    if (!window.confirm('Eliminar esta etiqueta?')) return;
                    await adminApi.deleteTag(t.id); ui.showToast('Eliminada'); load();
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