import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', preparing:'En préparation', ready:'Prête', delivered:'Livrée', cancelled:'Annulée' };
const NEXT_STATUS  = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered' };
const NEXT_LABEL   = { pending:'Confirmer', confirmed:'Démarrer préparation', preparing:'Marquer prête', ready:'Marquer livrée' };

export default function EmpOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    API.get('/orders', { params }).then(r => setOrders(r.data.orders)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.emit('join-staff');
    socket.on('new-order', () => { load(); toast('🔔 Nouvelle commande !'); });
    socket.on('order-updated', () => load());
    socket.on('order-cancelled', () => load());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/orders/${id}/status`, { status });
      toast.success(`Statut → ${STATUS_LABEL[status]}`);
      load();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const FILTERS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Commandes</h1>
      </div>

      <div className="filters-bar">
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Toutes' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <>
          {orders.length === 0 && <div className="empty-state"><div className="empty-icon">📋</div><h3>Aucune commande</h3></div>}
          <div className="table-wrap">
            {orders.length > 0 && (
              <table>
                <thead><tr>
                  <th>N°</th><th>Client</th><th>Plats</th><th>Total</th><th>Mode</th><th>Paiement</th><th>Statut</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.client?.name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-m)' }}>{o.client?.phone}</div>
                      </td>
                      <td style={{ fontSize: '.82rem', maxWidth: 200 }}>
                        {o.items.map(it => `${it.name} ×${it.quantity}`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{o.total?.toLocaleString()} Ar</td>
                      <td>{o.orderType === 'delivery' ? '🚚 Livraison' : '🏃 Retrait'}</td>
                      <td><span className={`badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'pending-pay'}`}>{o.paymentStatus === 'paid' ? 'Payé' : 'Non payé'}</span></td>
                      <td><span className={`badge badge-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {NEXT_STATUS[o.status] && (
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(o.id, NEXT_STATUS[o.status])}>
                              {NEXT_LABEL[o.status]}
                            </button>
                          )}
                          {o.status === 'pending' && (
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'cancelled')}>
                              Annuler
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(selected?.id === o.id ? null : o)}>
                            Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Commande {selected.orderNumber}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <strong>Client:</strong> {selected.client?.name} — {selected.client?.phone}<br/>
              {selected.deliveryAddress && <><strong>Adresse:</strong> {selected.deliveryAddress}<br/></>}
              {selected.clientNote && <><strong>Note:</strong> {selected.clientNote}</>}
            </div>
            {selected.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.88rem' }}>
                <span>{it.name} × {it.quantity}</span>
                <span>{(it.price * it.quantity).toLocaleString()} Ar</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 12, color: 'var(--primary)' }}>
              <span>Total</span><span>{selected.total?.toLocaleString()} Ar</span>
            </div>
            <div className="modal-footer">
              {NEXT_STATUS[selected.status] && (
                <button className="btn btn-success" onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status])}>
                  {NEXT_LABEL[selected.status]}
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
