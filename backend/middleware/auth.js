const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });

    const token   = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user    = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user)          return res.status(401).json({ message: 'Utilisateur introuvable.' });
    if (!user.isActive) return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Accès refusé. Rôle requis: ${roles.join(' ou ')}.` });
  next();
};

module.exports = { authenticate, authorize };
