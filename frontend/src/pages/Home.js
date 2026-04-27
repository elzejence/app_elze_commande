import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: '🚀', title: 'Livraison rapide', desc: 'Livraison en moins de 45 minutes dans toute la ville.', color: '#C0392B' },
  { icon: '👨‍🍳', title: 'Cuisine authentique', desc: 'Recettes traditionnelles préparées par nos chefs experts.', color: '#E67E22' },
  { icon: '💳', title: 'Paiement sécurisé', desc: 'Paiement en ligne ou à la livraison selon vos préférences.', color: '#27AE60' },
  { icon: '📱', title: 'Suivi en temps réel', desc: 'Suivez chaque étape de votre commande en direct.', color: '#2980B9' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const { add } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/menu?featured=true&available=true')
      .then(r => setFeatured(r.data.items.slice(0, 6)))
      .catch(() => {});
  }, []);

  const handleAdd = (item) => {
    add(item);
    toast.success(`${item.name} ajouté au panier !`);
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        {/* Floating decorative emojis */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
        }}>
          {['🍛', '🥩', '🍜', '🥗', '🍲', '🍹'].map((emoji, i) => (
            <div key={i} style={{
              position: 'absolute',
              fontSize: `${1.4 + (i % 3) * 0.5}rem`,
              opacity: 0.08,
              top: `${12 + (i * 13) % 70}%`,
              left: `${5 + (i * 16) % 90}%`,
              animation: `float ${3.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}>{emoji}</div>
          ))}
        </div>

        {/* Badge */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(230,126,34,.18)', border: '1px solid rgba(230,126,34,.35)',
            color: 'rgba(255,255,255,.85)', borderRadius: 20,
            padding: '5px 14px', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.4px'
          }}>
            🌟 Restaurant Malgache en ligne
          </span>
        </div>

        <h1 className="hero-title" style={{ position: 'relative', zIndex: 1 }}>
          Savourez la <span>cuisine malgache</span><br />
          <span style={{ fontSize: '.65em', color: 'rgba(255,255,255,.55)', fontStyle: 'italic', fontWeight: 400 }}>
            directement chez vous
          </span>
        </h1>
        <p className="hero-sub">
          Commandez en ligne, livraison ou retrait — fraîcheur et authenticité garanties
        </p>
        <div className="hero-btns">
          <button className="btn btn-accent btn-lg" onClick={() => navigate('/menu')} style={{ fontSize: '1rem' }}>
            🍽 Voir le menu
          </button>
          <Link
            to="/register"
            className="btn btn-lg"
            style={{
              background: 'rgba(255,255,255,.1)',
              border: '1.5px solid rgba(255,255,255,.25)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
            }}
          >
            Créer un compte
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', justifyContent: 'center', gap: 40,
          marginTop: 48, flexWrap: 'wrap',
        }}>
          {[
            { value: '500+', label: 'Clients satisfaits' },
            { value: '45 min', label: 'Livraison moyenne' },
            { value: '100%', label: 'Frais et naturel' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-l)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginTop: 2, letterSpacing: '.3px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '64px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'var(--accent)', marginBottom: 8 }}>
            Pourquoi nous choisir ?
          </div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', color: 'var(--dark)', letterSpacing: '-.3px' }}>
            Une expérience culinaire exceptionnelle
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: 'var(--r)', padding: '28px 24px',
              border: '1px solid var(--border-l)', boxShadow: 'var(--sh-sm)',
              transition: 'transform .2s, box-shadow .2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sh-sm)'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', marginBottom: 16,
                background: `${f.color}15`, border: `1.5px solid ${f.color}25`,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'DM Sans,sans-serif', color: 'var(--dark)', marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '.84rem', color: 'var(--text-l)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED MENU ── */}
      {featured.length > 0 && (
        <section style={{ padding: '0 28px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: 28, flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'var(--accent)', marginBottom: 6 }}>
                Sélection du chef
              </div>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', color: 'var(--dark)', letterSpacing: '-.3px', marginBottom: 0 }}>
                ⭐ Nos incontournables
              </h2>
            </div>
            <Link to="/menu" className="btn btn-outline btn-sm">Voir tout le menu →</Link>
          </div>
          <div className="menu-grid">
            {featured.map(item => (
              <div key={item.id} className="menu-card">
                {item.image
                  ? <img src={item.image} alt={item.name} className="menu-card-img" />
                  : <div className="menu-card-placeholder">🍛</div>
                }
                <div className="menu-card-body">
                  <div className="menu-card-cat">{item.category}</div>
                  <div className="menu-card-name">{item.name}</div>
                  <div className="menu-card-desc">{item.description || 'Plat délicieux préparé avec soin.'}</div>
                  <div className="menu-card-footer">
                    <span className="menu-card-price">{item.price.toLocaleString()} Ar</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAdd(item)}>
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA BANNER ── */}
      <section style={{
        margin: '0 28px 72px', borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(135deg,var(--dark) 0%,var(--dark-2) 100%)',
        padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', color: '#fff', fontSize: '1.9rem', marginBottom: 10, letterSpacing: '-.3px' }}>
            Prêt à commander ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.6)', marginBottom: 24, fontSize: '.95rem' }}>
            Créez votre compte gratuitement et profitez de nos délicieux plats.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/menu')}>
              🍽 Commander maintenant
            </button>
            <Link to="/register" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', color: '#fff' }}>
              S'inscrire gratuitement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
