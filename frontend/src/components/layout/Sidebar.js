import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../../context/AuthContext';

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    API.get('/messages/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {});
    const iv = setInterval(() => {
      API.get('/messages/unread-count')
        .then(r => setUnread(r.data.count))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const active = (path) => location.pathname === path ? 's-link active' : 's-link';
  const go = (path) => navigate(path);

  const adminLinks = [
    { section: 'Tableau de bord', links: [
      { label: 'Dashboard', icon: '📊', path: '/admin' },
    ]},
    { section: 'Gestion', links: [
      { label: 'Commandes',   icon: '📋', path: '/admin/orders' },
      { label: 'Menu / Plats',icon: '🍽',  path: '/admin/menu' },
      { label: 'Utilisateurs',icon: '👥', path: '/admin/users' },
    ]},
    { section: 'Communication', links: [
      { label: 'Messages', icon: '💬', path: '/admin/messages', badge: unread },
    ]},
    { section: 'Audit', links: [
      { label: 'Journal d\'activité', icon: '📜', path: '/admin/activity' },
    ]},
  ];

  const employeeLinks = [
    { section: 'Tableau de bord', links: [
      { label: 'Dashboard', icon: '📊', path: '/employee' },
    ]},
    { section: 'Gestion', links: [
      { label: 'Commandes', icon: '📋', path: '/employee/orders' },
      { label: 'Clients',   icon: '👤', path: '/employee/clients' },
      { label: 'Menu',      icon: '🍽',  path: '/employee/menu' },
    ]},
    { section: 'Communication', links: [
      { label: 'Messages', icon: '💬', path: '/employee/messages', badge: unread },
    ]},
  ];

  const links = role === 'admin' ? adminLinks : employeeLinks;
  const baseColor = role === 'admin' ? '#991B1B' : '#1E40AF';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">🍽 <span>Saveurs</span>Mada</div>
        <div className="sidebar-role">{role === 'admin' ? 'Administrateur' : 'Employé'}</div>
      </div>

      <nav className="sidebar-nav">
        {links.map(section => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.links.map(l => (
              <button
                key={l.path}
                className={active(l.path)}
                onClick={() => go(l.path)}
              >
                <span className="icon">{l.icon}</span>
                {l.label}
                {l.badge > 0 && <span className="s-badge">{l.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-email">{user?.email}</div>
        </div>
        <button className="s-link" onClick={logout} style={{ color: 'rgba(255,120,120,0.8)' }}>
          <span className="icon">🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}
