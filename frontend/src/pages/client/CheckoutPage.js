import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth, API } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, orderType, setOrderType, subtotal, deliveryFee, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    paymentMethod: 'cash',
    clientNote: ''
  });
  const [loading, setLoading] = useState(false);

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { toast.error('Panier vide.'); return; }
    if (orderType === 'delivery' && !form.deliveryAddress.trim()) {
      toast.error('Veuillez saisir une adresse de livraison.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        items: cart.map(c => ({ menuItem: c.menuItem, quantity: c.quantity })),
        orderType,
        deliveryAddress: form.deliveryAddress,
        paymentMethod: form.paymentMethod,
        clientNote: form.clientNote
      };
      const r = await API.post('/orders', payload);
      clear();
      toast.success('Commande passée avec succès !');
      navigate(`/orders/${r.data.order.id}/track`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Finaliser la commande</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <form onSubmit={submit}>
          {/* Order type */}
          <div className="card" style={{ padding: 22, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Mode de commande</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {['delivery', 'pickup'].map(t => (
                <button type="button" key={t} onClick={() => setOrderType(t)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: `2px solid ${orderType === t ? 'var(--primary)' : 'var(--border)'}`, background: orderType === t ? 'var(--primary)' : '#fff', color: orderType === t ? '#fff' : 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>
                  {t === 'delivery' ? '🚚 Livraison (+3 000 Ar)' : '🏃 Retrait sur place (gratuit)'}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <div className="card" style={{ padding: 22, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Adresse de livraison</h3>
              <div className="form-group">
                <label className="form-label">Adresse complète *</label>
                <textarea className="form-textarea" placeholder="Ex: Lot 45 B, Rue des Fleurs, Analakely, Antananarivo..." value={form.deliveryAddress} onChange={upd('deliveryAddress')} required />
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="card" style={{ padding: 22, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Mode de paiement</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ v: 'online', l: '💳 Paiement en ligne' }, { v: 'cash', l: '💵 Paiement à la livraison' }].map(p => (
                <button type="button" key={p.v} onClick={() => setForm({ ...form, paymentMethod: p.v })}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: `2px solid ${form.paymentMethod === p.v ? 'var(--primary)' : 'var(--border)'}`, background: form.paymentMethod === p.v ? 'var(--primary)' : '#fff', color: form.paymentMethod === p.v ? '#fff' : 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem' }}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="card" style={{ padding: 22, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Note pour le restaurant</h3>
            <textarea className="form-textarea" placeholder="Instructions spéciales, allergies, préférences..." value={form.clientNote} onChange={upd('clientNote')} />
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Envoi en cours...' : `✅ Confirmer la commande (${total.toLocaleString()} Ar)`}
          </button>
        </form>

        {/* Order summary */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: 14 }}>Ma commande</h3>
          {cart.map(item => (
            <div key={item.menuItem} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.88rem' }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString()} Ar</span>
            </div>
          ))}
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: 6 }}>
            <span>Sous-total</span><span>{subtotal.toLocaleString()} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: 10 }}>
            <span>Livraison</span><span>{deliveryFee.toLocaleString()} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
            <span>Total</span><span>{total.toLocaleString()} Ar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
