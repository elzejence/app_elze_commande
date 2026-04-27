import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', preparing:'En préparation', ready:'Prête', delivered:'Livrée', cancelled:'Annulée' };

export default function EmpDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [unread, setUnread] = useState(0);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/orders?limit=10'),
      API.get('/messages/unread-count')
    ]).then(([oR, mR]) => {
      const all = oR.data.orders;
      setOrders(all);
      setUnread(mR.data.count);
      setStats({
        pending:   all.filter(o => o.status === 'pending').length,
        preparing: all.filter(o => o.status === 'preparing').length,
        ready:     all.filter(o => o.status === 'ready').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-l)', marginTop: 4 }}>Tableau de bord employé — {new Date().toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">En attente</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-sub">commandes à confirmer</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">En préparation</div>
          <div className="stat-value">{stats.preparing}</div>
          <div className="stat-sub">en cours de préparation</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Prêtes</div>
          <div className="stat-value">{stats.ready}</div>
          <div className="stat-sub">à livrer / retirer</div>
        </div>
        <div className="stat-card info" style={{ cursor: 'pointer' }} onClick={() => navigate('/employee/messages')}>
          <div className="stat-label">Messages non lus</div>
          <div className="stat-value">{unread}</div>
          <div className="stat-sub">cliquez pour voir</div>
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: '#fff', borderRadius: 'var(--r)', padding: 22, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>Commandes récentes</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/employee/orders')}>Voir tout</button>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>Aucune commande</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>N°</th><th>Client</th><th>Total</th><th>Statut</th><th>Mode</th><th>Date</th>
              </tr></thead>
              <tbody>
                {orders.slice(0, 8).map(o => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/employee/orders')}>
                    <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                    <td>{o.client?.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.total?.toLocaleString()} Ar</td>
                    <td><span className={`badge badge-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                    <td>{o.orderType === 'delivery' ? '🚚' : '🏃'}</td>
                    <td style={{ color: 'var(--text-m)', fontSize: '.8rem' }}>{new Date(o.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
