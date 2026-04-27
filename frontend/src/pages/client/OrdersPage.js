import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', preparing:'En préparation', ready:'Prête', delivered:'Livrée', cancelled:'Annulée' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    API.get('/orders').then(r => setOrders(r.data.orders)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await API.patch(`/orders/${id}/cancel`);
      toast.success('Commande annulée.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const pay = async (id) => {
    try {
      await API.patch(`/orders/${id}/pay`);
      toast.success('Paiement enregistré.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Commandes</h1>
          <p className="page-sub">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Aucune commande</h3>
          <p>Passez votre première commande depuis notre menu.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/menu')}>
            Voir le menu
          </button>
        </div>
      )}

      {orders.map(order => (
        <div key={order.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>{order.orderNumber}</span>
              <span style={{ marginLeft: 10, fontSize: '.8rem', color: 'var(--text-m)' }}>
                {new Date(order.createdAt).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${order.status}`}>{STATUS_LABEL[order.status]}</span>
              <span className={`badge badge-${order.paymentStatus === 'paid' ? 'paid' : 'pending-pay'}`}>
                {order.paymentStatus === 'paid' ? '💳 Payé' : '💵 À payer'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '.85rem', color: 'var(--text-l)', marginBottom: 10 }}>
            {order.items.map(it => `${it.name} ×${it.quantity}`).join(' • ')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{order.total.toLocaleString()} Ar</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/orders/${order.id}/track`)}>
                📍 Suivre
              </button>
              {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
                <button className="btn btn-success btn-sm" onClick={() => pay(order.id)}>
                  💳 Marquer payé
                </button>
              )}
              {order.status === 'pending' && (
                <button className="btn btn-danger btn-sm" onClick={() => cancel(order.id)}>
                  ✕ Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
