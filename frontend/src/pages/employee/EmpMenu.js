import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATS = ['Entrées','Plats principaux','Desserts','Boissons','Snacks','Menus spéciaux'];
const EMPTY = { name:'', description:'', price:'', category:'Plats principaux', image:'', available:true, featured:false, preparationTime:15 };

export default function EmpMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('Tous');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (catFilter !== 'Tous') params.category = catFilter;
    if (search) params.search = search;
    API.get('/menu', { params }).then(r => setItems(r.data.items)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [catFilter, search]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, description: item.description, price: item.price, category: item.category, image: item.image || '', available: item.available, featured: item.featured, preparationTime: item.preparationTime });
    setEditId(item.id);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) { toast.error('Nom, prix et catégorie requis.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), preparationTime: Number(form.preparationTime) };
      if (editId) { await API.put(`/menu/${editId}`, payload); toast.success('Plat modifié.'); }
      else         { await API.post('/menu', payload);          toast.success('Plat ajouté.'); }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try { await API.delete(`/menu/${id}`); toast.success('Plat supprimé.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  const toggle = async (item) => {
    try {
      await API.put(`/menu/${item.id}`, { available: !item.available });
      toast.success(item.available ? 'Plat désactivé.' : 'Plat activé.');
      load();
    } catch { toast.error('Erreur.'); }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion du Menu</h1>
          <p style={{ color: 'var(--text-l)', marginTop: 4 }}>{items.length} plat{items.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Ajouter un plat</button>
      </div>

      <div className="search-wrap"><input className="form-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="filters-bar">
        {['Tous', ...CATS].map(c => (
          <button key={c} className={`filter-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          {items.length === 0 ? <div className="empty-state"><div className="empty-icon">🍽</div><h3>Aucun plat</h3></div> : (
            <table>
              <thead><tr><th>Plat</th><th>Catégorie</th><th>Prix</th><th>Préparation</th><th>Disponible</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--cream-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍛</div>
                        }
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '.76rem', color: 'var(--text-m)' }}>{item.description?.slice(0, 50)}{item.description?.length > 50 ? '…' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-client" style={{ fontSize: '.7rem' }}>{item.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.price?.toLocaleString()} Ar</td>
                    <td>{item.preparationTime} min</td>
                    <td>
                      <button onClick={() => toggle(item)} style={{ background: item.available ? 'var(--success)' : 'var(--text-m)', color: '#fff', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
                        {item.available ? 'Oui' : 'Non'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️ Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(item.id, item.name)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier le plat' : 'Nouveau plat'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={form.name} onChange={upd('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix (Ar) *</label>
                  <input className="form-input" type="number" min="0" value={form.price} onChange={upd('price')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select className="form-select" value={form.category} onChange={upd('category')}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temps de préparation (min)</label>
                  <input className="form-input" type="number" min="1" value={form.preparationTime} onChange={upd('preparationTime')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={upd('description')} style={{ minHeight: 70 }} />
              </div>
              <div className="form-group">
                <label className="form-label">URL de l'image</label>
                <input className="form-input" placeholder="https://..." value={form.image} onChange={upd('image')} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={form.available} onChange={upd('available')} />
                  Disponible
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={form.featured} onChange={upd('featured')} />
                  Mis en avant
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
