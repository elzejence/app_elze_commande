import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#F97316',
  ready:     '#10B981',
  delivered: '#059669',
  cancelled: '#EF4444'
};
const STATUS_LABEL = { pending:'Attente', confirmed:'Confirmée', preparing:'Préparation', ready:'Prête', delivered:'Livrée', cancelled:'Annulée' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!stats)  return <div className="alert alert-error">Impossible de charger les statistiques.</div>;

  const pieData = (stats.byStatus || []).map(s => ({
    name: STATUS_LABEL[s._id] || s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#999'
  }));

  const barData = (stats.last7 || []).map(d => ({
    date: d._id.slice(5),
    Commandes: d.orders,
    'CA (Ar)': Math.round(d.revenue / 1000)
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-l)', marginTop: 4 }}>
          Tableau de bord administrateur — {new Date().toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Clients inscrits</div>
          <div className="stat-value">{stats.users.clients}</div>
          <div className="stat-sub">comptes clients actifs</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Employés</div>
          <div className="stat-value">{stats.users.employees}</div>
          <div className="stat-sub">comptes employés</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Commandes aujourd'hui</div>
          <div className="stat-value">{stats.orders.today}</div>
          <div className="stat-sub">{stats.orders.pending} en attente</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">CA aujourd'hui</div>
          <div className="stat-value">{(stats.revenue.today / 1000).toFixed(0)}k</div>
          <div className="stat-sub">Ariary</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CA ce mois</div>
          <div className="stat-value">{(stats.revenue.month / 1000).toFixed(0)}k</div>
          <div className="stat-sub">Ariary</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">CA total</div>
          <div className="stat-value">{(stats.revenue.total / 1000).toFixed(0)}k</div>
          <div className="stat-sub">Ariary cumulés</div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: 22 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Activité des 7 derniers jours</h3>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><div className="empty-icon">📊</div><h3>Pas encore de données</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Commandes" fill="#C0392B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card" style={{ padding: 22 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Répartition des statuts</h3>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><div className="empty-icon">🥧</div><h3>Pas encore de données</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="card" style={{ padding: 22 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Actions rapides</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          {[
            { icon: '👤', label: 'Créer un employé',     path: '/admin/users',    color: 'var(--info)' },
            { icon: '📋', label: 'Voir les commandes',   path: '/admin/orders',   color: 'var(--accent)' },
            { icon: '🍽', label: 'Gérer le menu',        path: '/admin/menu',     color: 'var(--primary)' },
            { icon: '💬', label: 'Messages',             path: '/admin/messages', color: 'var(--success)' },
            { icon: '📜', label: 'Journal activité',     path: '/admin/activity', color: 'var(--dark-2)' },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ padding: '16px 12px', borderRadius: 'var(--r)', border: `1.5px solid ${a.color}20`, background: `${a.color}10`, cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}20`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: a.color }}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
