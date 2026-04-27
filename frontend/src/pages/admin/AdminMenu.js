import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATS = ['Entrées','Plats principaux','Desserts','Boissons','Snacks','Menus spéciaux'];
const EMPTY = { name:'', description:'', price:'', category:'Plats principaux', image:'', available:true, featured:false, preparationTime:15 };

export default function AdminMenu() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [catFilter, setCatFilter] = useState('Tous');
  const [search, setSearch]   = useState('');
  const [stats, setStats]     = useState({ total: 0, available: 0, featured: 0 });

  const load = () => {
    setLoading(true);
    const params = {};
    if (catFilter !== 'Tous') params.category = catFilter;
    if (search) params.search = search;
    API.get('/menu', { params }).then(r => {
      const all = r.data.items;
      setItems(all);
      setStats({ total: all.length, available: all.filter(i => i.available).length, featured: all.filter(i => i.featured).length });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [catFilter, search]);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, description: item.description || '', price: item.price, category: item.category, image: item.image || '', available: item.available, featured: item.featured, preparationTime: item.preparationTime || 15 });
    setEditId(item.id);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Nom et prix requis.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), preparationTime: Number(form.preparationTime) };
      if (editId) { await API.put(`/menu/${editId}`, payload); toast.success('Plat modifié.'); }
      else         { await API.post('/menu', payload);          toast.success('Plat ajouté.'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" définitivement ?`)) return;
    try { await API.delete(`/menu/${id}`); toast.success('Plat supprimé.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  const toggle = async (item, field) => {
    try {
      await API.put(`/menu/${item.id}`, { [field]: !item[field] });
      toast.success(`Plat ${field === 'available' ? (item.available ? 'désactivé' : 'activé') : (item.featured ? 'retiré des favoris' : 'mis en avant')}.`);
      load();
    } catch { toast.error('Erreur.'); }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  //_____________________________
  const handleImageUpload = async (file) => {
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  const reader = new FileReader();
  reader.onload = e => setForm(f => ({...f, image: e.target.result}));
  reader.readAsDataURL(file);
  const { data } = await API.post('/menu/upload-image', fd,
  { headers: { 'Content-Type': 'multipart/form-data' } });
  setForm(f => ({...f, image: data.url}));
  toast.success('Photo uploadée !');
  };

  // _________________________

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion du Menu</h1>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouveau plat</button>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <div className="stat-card"><div className="stat-label">Total plats</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card success"><div className="stat-label">Disponibles</div><div className="stat-value">{stats.available}</div></div>
        <div className="stat-card accent"><div className="stat-label">Mis en avant</div><div className="stat-value">{stats.featured}</div></div>
      </div>

      <div className="search-wrap"><input className="form-input" placeholder="Rechercher un plat..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="filters-bar">
        {['Tous', ...CATS].map(c => (
          <button key={c} className={`filter-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🍽</div><h3>Aucun plat dans cette catégorie</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plat</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Préparation</th>
                  <th>Commandes</th>
                  <th>Disponible</th>
                  <th>Mis en avant</th>
                  <th>Modifié par</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
                          : <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--cream-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍛</div>
                        }
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{item.name}</div>
                          <div style={{ fontSize: '.74rem', color: 'var(--text-m)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ background: 'var(--cream-d)', borderRadius: 12, padding: '2px 8px', fontSize: '.74rem', fontWeight: 600 }}>{item.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{item.price?.toLocaleString()} Ar</td>
                    <td style={{ fontSize: '.82rem' }}>{item.preparationTime} min</td>
                    <td style={{ fontSize: '.84rem', fontWeight: 600 }}>{item.totalOrders || 0}</td>
                    <td>
                      <button onClick={() => toggle(item, 'available')}
                        style={{ background: item.available ? 'var(--success)' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: '.76rem', fontWeight: 700, cursor: 'pointer' }}>
                        {item.available ? 'Oui' : 'Non'}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => toggle(item, 'featured')}
                        style={{ background: item.featured ? '#F59E0B' : 'transparent', color: item.featured ? '#fff' : 'var(--text-m)', border: `1px solid ${item.featured ? '#F59E0B' : 'var(--border)'}`, borderRadius: 20, padding: '3px 12px', fontSize: '.76rem', fontWeight: 700, cursor: 'pointer' }}>
                        {item.featured ? '⭐ Oui' : 'Non'}
                      </button>
                    </td>
                    <td style={{ fontSize: '.76rem', color: 'var(--text-m)' }}>
                      {item.lastModifiedBy ? `${item.lastModifiedBy.name} (${item.lastModifiedBy.role})` : '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
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

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier le plat' : 'Ajouter un plat'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom du plat *</label>
                  <input className="form-input" value={form.name} onChange={upd('name')} required placeholder="Ex: Ravitoto sy henakisoa" />
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
                <textarea className="form-textarea" value={form.description} onChange={upd('description')} placeholder="Décrivez ce plat..." style={{ minHeight: 70 }} />
              </div>
              <div className="form-group">
                <label className="form-label">URL de l'image</label>
                <input className="form-input" value={form.image} onChange={upd('image')} placeholder="https://..." />
              </div>
              {form.image && (
                <div style={{ marginBottom: 12 }}>
                  <img src={form.image} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 24, marginBottom: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={form.available} onChange={upd('available')} /> Disponible
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={form.featured} onChange={upd('featured')} /> ⭐ Mis en avant (page d'accueil)
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : editId ? '💾 Modifier' : '➕ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
