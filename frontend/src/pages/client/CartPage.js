import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CartPage() {
  const { cart, orderType, setOrderType, updateQty, remove, subtotal, deliveryFee, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="empty-icon">🛒</div>
          <h3>Votre panier est vide</h3>
          <p>Ajoutez des plats depuis notre menu.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/menu')}>
            Voir le menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Mon Panier</h1>
        <button className="btn btn-ghost btn-sm" onClick={clear}>🗑 Vider</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Items */}
        <div className="card" style={{ padding: 20 }}>
          {cart.map(item => (
            <div key={item.menuItem} className="cart-item">
              <div className="cart-img">
                {item.image ? <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /> : '🍛'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.95rem' }}>
                  {(item.price * item.quantity).toLocaleString()} Ar
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-m)' }}>{item.price.toLocaleString()} Ar / unité</div>
              </div>
              <div className="cart-qty">
                <button className="cart-qty-btn" onClick={() => updateQty(item.menuItem, item.quantity - 1)}>−</button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button className="cart-qty-btn" onClick={() => updateQty(item.menuItem, item.quantity + 1)}>+</button>
              </div>
              <button className="btn-icon" onClick={() => remove(item.menuItem)} style={{ marginLeft: 8 }}>🗑</button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 16 }}>Récapitulatif</h3>

          {/* Order type */}
          <div className="form-group">
            <label className="form-label">Mode de commande</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['delivery', 'pickup'].map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${orderType === t ? 'var(--primary)' : 'var(--border)'}`, background: orderType === t ? 'var(--primary)' : '#fff', color: orderType === t ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
                  {t === 'delivery' ? '🚚 Livraison' : '🏃 Retrait'}
                </button>
              ))}
            </div>
          </div>

          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.9rem' }}>
            <span>Sous-total</span>
            <span>{subtotal.toLocaleString()} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.9rem' }}>
            <span>Frais de livraison</span>
            <span>{deliveryFee.toLocaleString()} Ar</span>
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>{total.toLocaleString()} Ar</span>
          </div>

          {user ? (
            <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')}>
              Commander →
            </button>
          ) : (
            <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/login')}>
              Se connecter pour commander
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
