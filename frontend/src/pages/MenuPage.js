import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES = ['Tous', 'Entrées', 'Plats principaux', 'Desserts', 'Boissons', 'Snacks', 'Menus spéciaux'];

// Strip colour per category
const STRIP_CLASS = {
  'Entrées':       'accent',
  'Boissons':      'info',
  'Desserts':      'accent',
  'Snacks':        'success',
  'Menus spéciaux': 'accent',
};

// Resolve upload paths → full URL
const resolveImg = (src) => {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  // Use the CRA proxy when possible (relative URL works in dev), fall back to explicit host
  return (process.env.NODE_ENV === 'development')
    ? `http://localhost:5000${src}`
    : src;
};

// ── MenuCard ─────────────────────────────────────────────────────────────────
function MenuCard({ item, onAdd }) {
  const [imgState, setImgState] = useState('loading'); // loading | ok | contain | error
  const imgSrc = resolveImg(item.image);
  const strip  = STRIP_CLASS[item.category] || '';

  const handleLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.target;
    // If the image is small/square (icon-type), use contain mode
    if (naturalWidth < 300 || naturalHeight < 300) {
      setImgState('contain');
    } else {
      setImgState('ok');
    }
  }, []);

  const handleError = useCallback(() => {
    setImgState('error');
  }, []);

  return (
    <div className="menu-card">
      {/* ── IMAGE AREA ── */}
      <div className="menu-card-img-wrap">
        <div className={`menu-card-strip ${strip}`} />

        {imgSrc && imgState !== 'error' ? (
          <>
            {/* Hidden until loaded — prevents layout flash */}
            <img
              src={imgSrc}
              alt={item.name}
              className={`menu-card-img${imgState === 'contain' ? ' img-contain' : ''}`}
              style={{ opacity: imgState === 'loading' ? 0 : 1, transition: 'opacity .3s ease' }}
              onLoad={handleLoad}
              onError={handleError}
            />
            {/* Skeleton while loading */}
            {imgState === 'loading' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,#f0e8dc 25%,#e8d8c8 50%,#f0e8dc 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }} />
            )}
          </>
        ) : (
          /* Placeholder emoji when no image or broken link */
          <div className="menu-card-placeholder">
            <span>🍛</span>
            <span className="menu-card-placeholder-label">Photo à venir</span>
          </div>
        )}
      </div>

      {/* ── CARD BODY ── */}
      <div className="menu-card-body">
        <div className="menu-card-cat">{item.category}</div>
        <div className="menu-card-name">{item.name}</div>
        <div className="menu-card-desc">
          {item.description || 'Plat délicieux préparé avec soin.'}
        </div>

        {item.preparationTime && (
          <div className="menu-card-meta">
            <span>⏱</span>
            <span>{item.preparationTime} min</span>
          </div>
        )}

        <div className="menu-card-footer">
          <span className="menu-card-price">{Number(item.price).toLocaleString('fr-MG')} Ar</span>
          {onAdd && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onAdd(item)}
              aria-label={`Ajouter ${item.name} au panier`}
            >
              + Ajouter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MenuPage ──────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [items, setItems]     = useState([]);
  const [cat, setCat]         = useState('Tous');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const { add, count }        = useCart();
  const { user }              = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = { available: true };
    if (cat !== 'Tous') params.category = cat;
    if (search)         params.search   = search;
    API.get('/menu', { params })
      .then(r => setItems(r.data.items))
      .catch(() => toast.error('Impossible de charger le menu.'))
      .finally(() => setLoading(false));
  }, [cat, search]);

  const handleAdd = useCallback((item) => {
    if (user && user.role !== 'client') {
      toast.error('Seuls les clients peuvent commander.');
      return;
    }
    add(item);
    toast.success(`${item.name} ajouté au panier !`);
  }, [user, add]);

  // Guests can add to cart but need to log in at checkout
  const canAdd = !user || user.role === 'client';

  return (
    <div className="page">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notre Menu</h1>
          <p className="page-sub">Découvrez tous nos plats préparés avec passion</p>
        </div>
        {user?.role === 'client' && count > 0 && (
          <button className="btn btn-primary" onClick={() => navigate('/cart')}>
            🛒 Voir le panier ({count})
          </button>
        )}
      </div>

      {/* ── SEARCH ── */}
      <div className="search-wrap">
        <input
          className="form-input"
          placeholder="Rechercher un plat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Rechercher un plat"
        />
      </div>

      {/* ── CATEGORY FILTERS ── */}
      <div className="filters-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`filter-btn ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="menu-grid" style={{ marginTop: 8 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="menu-card">
              <div style={{
                height: 200,
                background: 'linear-gradient(90deg,#f0e8dc 25%,#e8d8c8 50%,#f0e8dc 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }} />
              <div className="menu-card-body" style={{ gap: 10 }}>
                <div style={{ height: 10, background: '#f0e8dc', borderRadius: 6, width: '40%' }} />
                <div style={{ height: 16, background: '#f0e8dc', borderRadius: 6, width: '80%' }} />
                <div style={{ height: 11, background: '#f0e8dc', borderRadius: 6, width: '65%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🍽</div>
          <h3>Aucun plat trouvé</h3>
          <p>Essayez une autre catégorie ou un autre mot-clé.</p>
        </div>
      )}

      {/* ── GRID ── */}
      {!loading && items.length > 0 && (
        <div className="menu-grid">
          {items.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              onAdd={canAdd ? handleAdd : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
