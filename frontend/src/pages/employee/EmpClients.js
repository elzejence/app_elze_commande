import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EmpClients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    API.get('/employee/clients', { params: { search } })
      .then(r => setClients(r.data.clients))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const openDetail = async (client) => {
    setSelected(client);
    try {
      const r = await API.get(`/employee/clients/${client.id}`);
      setDetail(r.data);
    } catch { toast.error('Erreur.'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Clients</h1>
        <p style={{ color: 'var(--text-l)', marginTop: 4 }}>{clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}</p>
      </div>

      <div className="search-wrap">
        <input className="form-input" placeholder="Rechercher par nom, email, téléphone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          {clients.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👤</div><h3>Aucun client</h3></div>
          ) : (
            <table>
              <thead><tr>
                <th>Nom</th><th>Email</th><th>Téléphone</th><th>Adresse</th><th>Statut</th><th>Inscrit le</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td style={{ fontSize: '.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                    <td><span className={`badge badge-${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-m)' }}>{new Date(c.createdAt).toLocaleDateString('fr')}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openDetail(c)}>Voir commandes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Client: {selected.name}</h2>
              <button className="modal-close" onClick={() => { setSelected(null); setDetail(null); }}>✕</button>
            </div>
            <div style={{ marginBottom: 14, fontSize: '.88rem', color: 'var(--text-l)' }}>
              📧 {selected.email} &nbsp;|&nbsp; 📞 {selected.phone || 'N/A'} &nbsp;|&nbsp; 📍 {selected.address || 'N/A'}
            </div>
            <h4 style={{ marginBottom: 10 }}>Historique des commandes</h4>
            {!detail ? (
              <div className="loading-screen" style={{ minHeight: 60 }}><div className="spinner" /></div>
            ) : detail.orders.length === 0 ? (
              <p style={{ color: 'var(--text-m)', fontSize: '.86rem' }}>Aucune commande.</p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {detail.orders.map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '.84rem' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{o.orderNumber}</span>
                      <span className={`badge badge-${o.status}`} style={{ marginLeft: 8 }}>{o.status}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.total?.toLocaleString()} Ar</span>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setSelected(null); setDetail(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
