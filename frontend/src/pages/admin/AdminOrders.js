import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', preparing:'En préparation', ready:'Prête', delivered:'Livrée', cancelled:'Annulée' };
const NEXT_STATUS  = { pending:'confirmed', confirmed:'preparing', preparing:'ready', ready:'delivered' };
const NEXT_LABEL   = { pending:'Confirmer', confirmed:'Démarrer prép.', preparing:'Marquer prête', ready:'Marquer livrée' };
const ALL_STATUSES = ['all','pending','confirmed','preparing','ready','delivered','cancelled'];

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [note, setNote]       = useState('');

  const load = () => {
    setLoading(true);
    const params = { limit: 50 };
    if (filter !== 'all') params.status = filter;
    API.get('/orders', { params })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  // Real-time socket
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.emit('join-staff');
    socket.on('new-order',      () => { load(); toast('🔔 Nouvelle commande reçue !'); });
    socket.on('order-updated',  () => load());
    socket.on('order-cancelled',() => load());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/orders/${id}/status`, { status, note });
      toast.success(`Statut → ${STATUS_LABEL[status]}`);
      setNote('');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  const markPaid = async (id) => {
    try {
      await API.patch(`/orders/${id}/pay`);
      toast.success('Paiement enregistré.');
      load();
    } catch { toast.error('Erreur.'); }
  };

  const filtered = search
    ? orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.client?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>
          Gestion des Commandes
        </h1>
        <p style={{ color: 'var(--text-l)', marginTop: 4 }}>{total} commande{total > 1 ? 's' : ''} au total</p>
      </div>

      <div className="filters-bar">
        {ALL_STATUSES.map(s => (
          <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Toutes' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="Rechercher par numéro, client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>Aucune commande</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Plats</th>
                  <th>Mode</th>
                  <th>Paiement</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Validé par</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '.85rem' }}>{o.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.86rem' }}>{o.client?.name}</div>
                      <div style={{ fontSize: '.74rem', color: 'var(--text-m)' }}>{o.client?.phone}</div>
                    </td>
                    <td style={{ fontSize: '.8rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.items?.map(it => `${it.name}×${it.quantity}`).join(', ')}
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{o.orderType === 'delivery' ? '🚚 Livraison' : '🏃 Retrait'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: '.76rem', color: 'var(--text-m)' }}>{o.paymentMethod === 'cash' ? '💵 Espèces' : '💳 En ligne'}</span>
                        <span className={`badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'pending-pay'}`} style={{ fontSize: '.7rem' }}>
                          {o.paymentStatus === 'paid' ? 'Payé' : 'À payer'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{o.total?.toLocaleString()} Ar</td>
                    <td><span className={`badge badge-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-m)' }}>
                      {o.validatedBy ? `${o.validatedBy.name} (${o.validatedBy.role})` : '—'}
                    </td>
                    <td style={{ fontSize: '.76rem', color: 'var(--text-m)', whiteSpace: 'nowrap' }}>
                      {new Date(o.createdAt).toLocaleDateString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(selected?.id === o.id ? null : o); setNote(''); }}>
                          Détails
                        </button>
                        {NEXT_STATUS[o.status] && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(o.id, NEXT_STATUS[o.status])}>
                            {NEXT_LABEL[o.status]}
                          </button>
                        )}
                        {o.paymentStatus === 'pending' && o.status !== 'cancelled' && (
                          <button className="btn btn-accent btn-sm" onClick={() => markPaid(o.id)}>
                            💳 Payé
                          </button>
                        )}
                        {['pending','confirmed'].includes(o.status) && (
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'cancelled')}>
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Commande {selected.orderNumber}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Client info */}
            <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: '.86rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 Informations client</div>
              <div>{selected.client?.name} — {selected.client?.email}</div>
              {selected.client?.phone && <div>📞 {selected.client.phone}</div>}
              {selected.deliveryAddress && <div>📍 {selected.deliveryAddress}</div>}
              {selected.clientNote && <div style={{ marginTop: 6, fontStyle: 'italic', color: 'var(--text-l)' }}>📝 "{selected.clientNote}"</div>}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 14 }}>
              {selected.items?.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '.86rem' }}>
                  <span>{it.name} × {it.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{(it.price * it.quantity)?.toLocaleString()} Ar</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--primary)', marginTop: 10, fontSize: '1rem' }}>
                <span>Total</span>
                <span>{selected.total?.toLocaleString()} Ar</span>
              </div>
            </div>

            {/* Status history */}
            {selected.statusHistory?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 8 }}>📋 Historique des statuts</div>
                {[...selected.statusHistory].reverse().map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: '.8rem' }}>
                    <span className={`badge badge-${h.status}`} style={{ fontSize: '.68rem' }}>{STATUS_LABEL[h.status]}</span>
                    <span style={{ color: 'var(--text-m)' }}>{new Date(h.timestamp).toLocaleString('fr')}</span>
                    {h.note && <span style={{ color: 'var(--text-l)', fontStyle: 'italic' }}>— {h.note}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Note for status change */}
            {NEXT_STATUS[selected.status] && (
              <div className="form-group">
                <label className="form-label">Note (optionnelle)</label>
                <input className="form-input" placeholder="Ex: Livreur en route, retard 5 min..." value={note} onChange={e => setNote(e.target.value)} />
              </div>
            )}

            <div className="modal-footer">
              {NEXT_STATUS[selected.status] && (
                <button className="btn btn-success" onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status])}>
                  ✅ {NEXT_LABEL[selected.status]}
                </button>
              )}
              {['pending','confirmed'].includes(selected.status) && (
                <button className="btn btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>
                  ✕ Annuler la commande
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
