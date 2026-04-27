import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Bienvenue, ${user.name} !`);
      if (user.role === 'admin')         navigate('/admin');
      else if (user.role === 'employee') navigate('/employee');
      else                               navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-icon">🍽</div>
          <h1 className="auth-left-title">
            <span>Saveurs</span>Mada
          </h1>
          <p className="auth-left-sub">
            La cuisine malgache authentique, livrée directement chez vous avec amour.
          </p>
          <div className="auth-left-features">
            {[
              { icon: '🚀', text: 'Livraison en moins de 45 minutes' },
              { icon: '👨‍🍳', text: 'Recettes traditionnelles authentiques' },
              { icon: '📍', text: 'Suivi de commande en temps réel' },
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

          <h2 className="auth-heading">Bon retour 👋</h2>
          <p className="auth-sub">Connectez-vous à votre compte pour commander</p>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input
                className="form-input"
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Connexion en cours…' : 'Se connecter →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '.88rem', color: 'var(--text-l)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
