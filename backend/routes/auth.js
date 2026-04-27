const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// POST /api/auth/register  — clients uniquement
router.post('/register', [
  body('name').notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe min. 6 caractères')
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    const { name, email, password, phone, address } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé.' });

    const user = await User.create({ name, email, password, phone, address, role: 'client' });
    res.status(201).json({ token: sign(user.id), user: user.toSafeJSON() });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });

    await user.update({ lastLogin: new Date() });
    await logActivity(user.id, 'login', `Connexion depuis ${req.ip}`);

    res.json({ token: sign(user.id), user: user.toSafeJSON() });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const fields = {};
    if (name    !== undefined) fields.name    = name;
    if (phone   !== undefined) fields.phone   = phone;
    if (address !== undefined) fields.address = address;

    await req.user.update(fields);
    await logActivity(req.user.id, 'profile_update', `Champs: ${Object.keys(fields).join(', ')}`);
    res.json({ user: req.user.toSafeJSON(), message: 'Profil mis à jour.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Nouveau mot de passe min. 6 caractères.' });

    const user = await User.findByPk(req.user.id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });

    await user.update({ password: newPassword });
    res.json({ message: 'Mot de passe modifié.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
