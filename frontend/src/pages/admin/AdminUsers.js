import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_EMP = { name: '', email: '', password: '', phone: '' };
const EMPTY_PWD = { newPassword: '' };

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [empForm, setEmpForm]       = useState(EMPTY_EMP);
  const [saving, setSaving]         = useState(false);

  const [pwdModal, setPwdModal]   = useState(null); // userId
  const [pwdForm, setPwdForm]     = useState(EMPTY_PWD);

  const [detailUser, setDetailUser] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { search };
    if (roleFilter !== 'all') params.role = roleFilter;
    API.get('/admin/users', { params })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [roleFilter, search]);

  // Create employee
  const createEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.email || empForm.password.length < 6) {
      toast.error('Nom, email et mot de passe (min. 6 chars) requis.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/admin/employees', empForm);
      toast.success('Compte employé créé avec succès.');
      setShowCreate(false);
      setEmpForm(EMPTY_EMP);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  // Toggle active
  const toggleActive = async (id, name, isActive) => {
    if (!window.confirm(`${isActive ? 'Désactiver' : 'Réactiver'} le compte de ${name} ?`)) return;
    try {
      const r = await API.patch(`/admin/users/${id}/toggle-active`);
      toast.success(r.data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  // Delete
  const deleteUser = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${name} ? Cette action est irréversible.`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success('Compte supprimé.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  // Reset password
  const resetPassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword.length < 6) { toast.error('Min. 6 caractères.'); return; }
    try {
      await API.patch(`/admin/users/${pwdModal}/reset-password`, pwdForm);
      toast.success('Mot de passe réinitialisé.');
      setPwdModal(null);
      setPwdForm(EMPTY_PWD);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  // View detail
  const viewDetail = async (uid) => {
    try {
      const r = await API.get(`/admin/users/${uid}`);
      setDetailUser(r.data);
    } catch { toast.error('Erreur.'); }
  };

  const upd = (set, key) => (e) => set(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Utilisateurs</h1>
          <p style={{ color: 'var(--text-l)', marginTop: 4 }}>{total} utilisateur{total > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Créer un employé
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'client', 'employee'].map(r => (
          <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
            {r === 'all' ? 'Tous' : r === 'client' ? '👤 Clients' : '🧑‍💼 Employés'}
          </button>
        ))}
        <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Rechercher nom ou email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          {users.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><h3>Aucun utilisateur</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Dernière connexion</th>
                  <th>Créé par</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.role === 'employee' ? '#1E40AF' : '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{u.name}</div>
                          <div style={{ fontSize: '.76rem', color: 'var(--text-m)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role === 'client' ? 'Client' : 'Employé'}</span></td>
                    <td style={{ fontSize: '.84rem' }}>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? '✅ Actif' : '🚫 Inactif'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-m)' }}>{new Date(u.createdAt).toLocaleDateString('fr')}</td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-m)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-m)' }}>{u.createdBy?.name || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => viewDetail(u.id)} title="Voir détails">👁</button>
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-warn' : 'btn-success'}`}
                          onClick={() => toggleActive(u.id, u.name, u.isActive)}
                          title={u.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {u.isActive ? '🚫' : '✅'}
                        </button>
                        {u.role === 'employee' && (
                          <button className="btn btn-outline btn-sm" onClick={() => { setPwdModal(u.id); setPwdForm(EMPTY_PWD); }} title="Réinitialiser mot de passe">
                            🔐
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.name)} title="Supprimer">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE EMPLOYEE ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Créer un compte Employé</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="alert alert-info">
              ℹ️ Seul l'administrateur peut créer des comptes employés. Le compte sera immédiatement actif.
            </div>
            <form onSubmit={createEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom complet *</label>
                  <input className="form-input" placeholder="Jean Dupont" value={empForm.name} onChange={upd(setEmpForm, 'name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" placeholder="+261 34..." value={empForm.phone} onChange={upd(setEmpForm, 'phone')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="employe@restaurant.com" value={empForm.email} onChange={upd(setEmpForm, 'email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input className="form-input" type="password" placeholder="Min. 6 caractères" value={empForm.password} onChange={upd(setEmpForm, 'password')} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Création...' : '✅ Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD ── */}
      {pwdModal && (
        <div className="modal-overlay" onClick={() => setPwdModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Réinitialiser le mot de passe</h2>
              <button className="modal-close" onClick={() => setPwdModal(null)}>✕</button>
            </div>
            <form onSubmit={resetPassword}>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe *</label>
                <input className="form-input" type="password" placeholder="Min. 6 caractères" value={pwdForm.newPassword} onChange={upd(setPwdForm, 'newPassword')} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setPwdModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">🔐 Réinitialiser</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: USER DETAIL ── */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Profil: {detailUser.user.name}</h2>
              <button className="modal-close" onClick={() => setDetailUser(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.86rem', marginBottom: 16 }}>
              {[
                ['Email', detailUser.user.email],
                ['Téléphone', detailUser.user.phone || '—'],
                ['Rôle', detailUser.user.role],
                ['Statut', detailUser.user.isActive ? 'Actif' : 'Inactif'],
                ['Inscrit le', new Date(detailUser.user.createdAt).toLocaleDateString('fr')],
                ['Dernière connexion', detailUser.user.lastLogin ? new Date(detailUser.user.lastLogin).toLocaleString('fr') : 'Jamais'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: 'var(--text-m)', fontSize: '.78rem', display: 'block', marginBottom: 2 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            {detailUser.user.address && (
              <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '8px 12px', fontSize: '.84rem', marginBottom: 14 }}>
                📍 {detailUser.user.address}
              </div>
            )}
            {detailUser.orders?.length > 0 && (
              <>
                <h4 style={{ marginBottom: 8, fontSize: '.9rem' }}>Dernières commandes</h4>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {detailUser.orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{o.orderNumber}</span>
                        <span className={`badge badge-${o.status}`} style={{ marginLeft: 8, fontSize: '.7rem' }}>{o.status}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.total?.toLocaleString()} Ar</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailUser(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
