import React, { useState } from 'react';
import { useAuth, API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/auth/profile', profile);
      await refreshUser();
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const savePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Mot de passe modifié.');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon Profil</h1>
          <p className="page-sub">Gérez vos informations personnelles</p>
        </div>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: '#fff', borderRadius: 'var(--r)', marginBottom: 20, border: '1px solid var(--border)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 700 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ color: 'var(--text-l)', fontSize: '.88rem' }}>{user?.email}</div>
          <span className="badge badge-client" style={{ marginTop: 4 }}>Client</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 4, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[{ k: 'profile', l: '👤 Mon profil' }, { k: 'password', l: '🔐 Mot de passe' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: tab === t.k ? 'var(--primary)' : 'transparent', color: tab === t.k ? '#fff' : 'var(--text-l)', fontWeight: 700, cursor: 'pointer', fontSize: '.86rem' }}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 24, maxWidth: 480 }}>
        {tab === 'profile' && (
          <form onSubmit={saveProfile}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 18 }}>Informations personnelles</h3>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse de livraison par défaut</label>
              <textarea className="form-textarea" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} placeholder="Votre adresse habituele..." />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={savePwd}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 18 }}>Changer le mot de passe</h3>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input className="form-input" type="password" value={pwd.currentPassword} onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input className="form-input" type="password" placeholder="Min. 6 caractères" value={pwd.newPassword} onChange={e => setPwd({ ...pwd, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input className="form-input" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Modification...' : '🔐 Modifier le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
