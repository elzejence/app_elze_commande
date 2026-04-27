import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'pending',   label: 'En attente', icon: '⏳' },
  { key: 'confirmed', label: 'Confirmée',  icon: '✅' },
  { key: 'preparing', label: 'En préparation', icon: '👨‍🍳' },
  { key: 'ready',     label: 'Prête',      icon: '🔔' },
  { key: 'delivered', label: 'Livrée',     icon: '🏠' },
];

const STATUS_IDX = { pending: 0, confirmed: 1, preparing: 2, ready: 3, delivered: 4, cancelled: -1 };

export default function OrderTrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then(r => setOrder(r.data.order))
      .catch(() => toast.error('Commande introuvable.'))
      .finally(() => setLoading(false));

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.emit('join-order', id);
    socket.on('order-update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, status } : prev);
      toast.success(`Statut mis à jour: ${status}`);
    });
    return () => socket.disconnect();
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!order)  return <div className="page"><div className="empty-state"><h3>Commande introuvable</h3></div></div>;

  const currentIdx = STATUS_IDX[order.status] ?? 0;
  const cancelled  = order.status === 'cancelled';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suivi de commande</h1>
          <p className="page-sub">{order.orderNumber}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>← Mes commandes</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Status */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 20 }}>Statut de la commande</h3>
            {cancelled ? (
              <div className="alert alert-error">❌ Cette commande a été annulée.</div>
            ) : (
              <div className="track-steps">
                {STEPS.map((step, i) => (
                  <React.Fragment key={step.key}>
                    <div className={`track-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}`}>
                      <div className="track-circle">{i <= currentIdx ? step.icon : '○'}</div>
                      <div className="track-label">{step.label}</div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`track-line ${i < currentIdx ? 'done' : ''}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {order.statusHistory?.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Historique</h3>
              {[...order.statusHistory].reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', textTransform: 'capitalize' }}>{h.status}</div>
                    {h.note && <div style={{ fontSize: '.8rem', color: 'var(--text-l)' }}>{h.note}</div>}
                    <div style={{ fontSize: '.75rem', color: 'var(--text-m)' }}>{new Date(h.timestamp).toLocaleString('fr')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order details */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Détails</h3>
          <div style={{ fontSize: '.85rem', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-l)' }}>Mode</span>
              <span style={{ fontWeight: 600 }}>{order.orderType === 'delivery' ? '🚚 Livraison' : '🏃 Retrait'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-l)' }}>Paiement</span>
              <span className={`badge badge-${order.paymentStatus}`}>{order.paymentStatus === 'paid' ? 'Payé' : 'En attente'}</span>
            </div>
            {order.deliveryAddress && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text-l)' }}>Adresse: </span>
                <span>{order.deliveryAddress}</span>
              </div>
            )}
          </div>
          <hr className="divider" />
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem', marginBottom: 6 }}>
              <span>{it.name} × {it.quantity}</span>
              <span>{(it.price * it.quantity).toLocaleString()} Ar</span>
            </div>
          ))}
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--primary)' }}>
            <span>Total</span>
            <span>{order.total.toLocaleString()} Ar</span>
          </div>
          {order.clientNote && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, fontSize: '.82rem', color: 'var(--text-l)' }}>
              📝 {order.clientNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
