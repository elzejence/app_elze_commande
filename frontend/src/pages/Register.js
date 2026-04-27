import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Mot de passe minimum 6 caractères.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || err.message
        || 'Erreur lors de l\'inscription.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-icon">🍛</div>
          <h1 className="auth-left-title">
            Rejoignez <span>SaveursMada</span>
          </h1>
          <p className="auth-left-sub">
            Créez votre compte et accédez à toute la richesse de la cuisine malgache traditionnelle.
          </p>
          <div className="auth-left-features">
            {[
              { icon: '🎁', text: 'Accès à tous nos plats du jour' },
              { icon: '📋', text: 'Historique complet de vos commandes' },
              { icon: '💬', text: 'Chat direct avec notre équipe' },
            ].map(f => (
              <div key={f.text} className="auth-feature">
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo-mobile">
            🍽 <span>Saveurs</span>Mada
          </div>

          <h2 className="auth-heading">Créer un compte</h2>
          <p className="auth-sub">Inscription gratuite — prêt en 1 minute</p>

          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" placeholder="Jean Dupont" value={form.name} onChange={upd('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" placeholder="+261 34 00 000 00" value={form.phone} onChange={upd('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse email *</label>
              <input className="form-input" type="email" placeholder="votre@email.com" value={form.email} onChange={upd('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input className="form-input" type="password" placeholder="Min. 6 caractères" value={form.password} onChange={upd('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse de livraison</label>
              <input className="form-input" placeholder="Ex: Lot 123, Analakely, Antananarivo" value={form.address} onChange={upd('address')} />
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Création du compte…' : 'Créer mon compte →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.88rem', color: 'var(--text-l)' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
