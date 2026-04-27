import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const active = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <span style={{ fontSize: '1.4rem' }}>🍽</span>
        <span>Saveurs</span>
        <span style={{ color: 'rgba(255,255,255,.85)', fontWeight: 400 }}>Mada</span>
      </Link>

      {/* Navigation links */}
      <div className="nav-links">
        <Link to="/"     className={active('/')}>Accueil</Link>
        <Link to="/menu" className={active('/menu')}>Menu</Link>

        {user?.role === 'client' && (
          <>
            <Link to="/orders"   className={active('/orders')}>Mes commandes</Link>
            <Link to="/messages" className={active('/messages')}>💬 Messages</Link>
            <Link to="/profile"  className={active('/profile')}>Profil</Link>
          </>
        )}

        {!user && (
          <>
            <Link to="/login"    className={active('/login')}>Connexion</Link>
            <Link to="/register" className={active('/register')}
              style={{
                background: 'rgba(230,126,34,.2)', border: '1px solid rgba(230,126,34,.35)',
                color: 'var(--accent-l)', borderRadius: 'var(--r-sm)', padding: '7px 14px',
              }}
            >
              S'inscrire
            </Link>
          </>
        )}

        {user && (user.role === 'employee' || user.role === 'admin') && (
          <button
            className="nav-link"
            onClick={() => navigate(user.role === 'admin' ? '/admin' : '/employee')}
          >
            🏠 Dashboard
          </button>
        )}

        {user && (
          <div className="nav-user" style={{ marginLeft: 6 }}>
            <div className="nav-avatar">{user.name[0].toUpperCase()}</div>
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.8rem' }}>
              {user.name.split(' ')[0]}
            </span>
            <button
              className="nav-link"
              onClick={logout}
              style={{ color: 'rgba(255,120,120,.85)', fontSize: '.82rem' }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Cart button */}
      {user?.role === 'client' && (
        <button className="nav-cart" onClick={() => navigate('/cart')}>
          🛒 Panier
          {count > 0 && <span className="cart-count">{count}</span>}
        </button>
      )}
    </nav>
  );
}
