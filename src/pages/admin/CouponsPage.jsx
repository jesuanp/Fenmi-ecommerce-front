import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

const EMPTY = { code: '', type: 'PERCENT', value: 0, minPurchase: '', startsAt: '', endsAt: '', maxUses: '', maxUsesPerUser: '', active: true };

export default function AdminCouponsPage() {
  const ui = useUI();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState(null);

  const load = () => adminApi.listCoupons().then((d) => setItems(d.data));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code, type: form.type, value: Number(form.value) || 0,
      minPurchase: form.minPurchase ? Number(form.minPurchase) : null,
      startsAt: form.startsAt || null, endsAt: form.endsAt || null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
      active: form.active
    };
    try {
      if (editId) await adminApi.updateCoupon(editId, payload);
      else await adminApi.createCoupon(payload);
      ui.showToast('Cupón guardado');
      setForm({ ...EMPTY });
      setEditId(null);
      load();
    } catch (err) { ui.showToast(err.response?.data?.error?.message || 'Error'); }
  };

  return (
    <div>
      <h1 className="admin-title">Cupones</h1>
      <div className="admin-card" style={{ maxWidth: 680 }}>
        <h3 style={{ marginBottom: 12 }}>{editId ? 'Editar' : 'Nuevo'} cupón</h3>
        <form className="form-grid" onSubmit={save}>
          <div className="afield"><label>Código</label><input value={form.code} onChange={(e) => set('code', e.target.value)} required /></div>
          <div className="afield"><label>Tipo</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="PERCENT">Porcentaje</option>
              <option value="FIXED">Valor fijo</option>
              <option value="FREE_SHIPPING">Envío gratis</option>
            </select>
          </div>
          <div className="afield"><label>Valor (COP o %)</label><input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} /></div>
          <div className="afield"><label>Compra mínima</label><input type="number" value={form.minPurchase} onChange={(e) => set('minPurchase', e.target.value)} /></div>
          <div className="afield"><label>Inicio</label><input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} /></div>
          <div className="afield"><label>Fin</label><input type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} /></div>
          <div className="afield"><label>Máx. usos</label><input type="number" value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} /></div>
          <div className="afield"><label>Por usuario</label><input type="number" value={form.maxUsesPerUser} onChange={(e) => set('maxUsesPerUser', e.target.value)} /></div>
          <div className="full" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Activo</label>
            <button className="btn lime small" type="submit">{editId ? 'Guardar' : 'Crear'}</button>
            {editId && <button type="button" className="btn-sm" onClick={() => { setEditId(null); setForm({ ...EMPTY }); }}>Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Usos</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.type}</td>
                <td>{c.type === 'PERCENT' ? `${c.value}%` : money(c.value)}</td>
                <td>{c.max_uses ?? '∞'}</td>
                <td><span className={'status-badge ' + (c.active ? 'active' : 'cancelled')}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                <td className="admin-actions">
                  <button className="btn-sm" onClick={() => {
                    setEditId(c.id);
                    setForm({
                      code: c.code, type: c.type, value: c.value, minPurchase: c.min_purchase || '',
                      startsAt: c.starts_at ? c.starts_at.slice(0, 10) : '', endsAt: c.ends_at ? c.ends_at.slice(0, 10) : '',
                      maxUses: c.max_uses || '', maxUsesPerUser: c.max_uses_per_user || '', active: c.active
                    });
                  }}>Editar</button>
                  <button className="btn-sm danger" onClick={async () => {
                    if (!window.confirm('Eliminar cupón?')) return;
                    await adminApi.deleteCoupon(c.id); ui.showToast('Eliminado'); load();
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