import React, { useState, useEffect } from 'react';
import { API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ACTION_ICONS = {
  order_create:   '🛒',
  order_cancel:   '❌',
  order_status:   '🔄',
  menu_create:    '➕',
  menu_update:    '✏️',
  menu_delete:    '🗑',
  profile_update: '👤',
  send_message:   '💬',
  view_client:    '👁',
  create_employee:'🧑‍💼',
  toggle_user:    '🔒',
  delete_user:    '🗑',
  reset_password: '🔐',
  login:          '🔑',
};

const ROLE_COLORS = { client: '#5B21B6', employee: '#1E40AF', admin: '#991B1B' };

function fmt(ts) {
  return new Date(ts).toLocaleString('fr', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminActivity() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (roleFilter !== 'all') params.role = roleFilter;
    API.get('/admin/activity', { params })
      .then(r => setLogs(r.data.logs))
      .catch(() => toast.error('Erreur chargement.'))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  const allActions = [...new Set(logs.map(l => l.action))].sort();

  const filtered = logs.filter(l => {
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    const matchSearch = !search ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', color: 'var(--dark)' }}>
          Journal d'Activité
        </h1>
        <p style={{ color: 'var(--text-l)', marginTop: 4 }}>
          Toutes les actions effectuées par les clients et les employés
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div className="filters-bar" style={{ margin: 0 }}>
          {['all', 'client', 'employee'].map(r => (
            <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'Tous les rôles' : r === 'client' ? '👤 Clients' : '🧑‍💼 Employés'}
            </button>
          ))}
        </div>

        <select className="form-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="all">Toutes les actions</option>
          {allActions.map(a => <option key={a} value={a}>{ACTION_ICONS[a] || '•'} {a.replace(/_/g, ' ')}</option>)}
        </select>

        <input className="form-input" placeholder="Rechercher utilisateur, action, détail..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Total actions</div>
          <div className="stat-value">{logs.length}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Actions clients</div>
          <div className="stat-value">{logs.filter(l => l.user?.role === 'client').length}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Actions employés</div>
          <div className="stat-value">{logs.filter(l => l.user?.role === 'employee').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Affichés</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📜</div><h3>Aucune activité</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-m)', whiteSpace: 'nowrap' }}>
                      {fmt(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: ROLE_COLORS[log.user?.role] || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {log.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.84rem' }}>{log.user?.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-m)' }}>{log.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${log.user?.role}`}>
                        {log.user?.role === 'client' ? 'Client' : log.user?.role === 'employee' ? 'Employé' : 'Admin'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1rem' }}>{ACTION_ICONS[log.action] || '•'}</span>
                        <span style={{ fontSize: '.82rem', fontWeight: 600, background: 'var(--cream-d)', padding: '2px 8px', borderRadius: 10 }}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--text-l)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
