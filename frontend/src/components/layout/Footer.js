import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand">🍽 <span>Saveurs</span>Mada</div>
            <p className="footer-desc">
              Restaurant malgache en ligne — découvrez l'authenticité de nos recettes traditionnelles,
              livrées fraîches directement chez vous.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div className="footer-col-title">Navigation</div>
            <Link to="/" className="footer-link">Accueil</Link>
            <Link to="/menu" className="footer-link">Notre Menu</Link>
            <Link to="/register" className="footer-link">Créer un compte</Link>
            <Link to="/login" className="footer-link">Se connecter</Link>
          </div>

          {/* Informations */}
          <div>
            <div className="footer-col-title">Contact</div>
            <span className="footer-link">📍 Antananarivo, Madagascar</span>
            <span className="footer-link">📞 +261 34 00 000 00</span>
            <span className="footer-link">✉️ contact@saveursmada.mg</span>
            <span className="footer-link">🕐 Lun – Sam : 10h – 22h</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} <span>SaveursMada</span> — Tous droits réservés</p>
          <div className="footer-badges">
            <span className="footer-badge">🔒 Paiement sécurisé</span>
            <span className="footer-badge">🚀 Livraison rapide</span>
            <span className="footer-badge">⭐ Qualité garantie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
