const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const { MenuItem, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');
const upload = require('../middleware/upload');

// POST /api/menu/upload-image
router.post('/upload-image',
  authenticate,
  authorize('admin', 'employee'),
  upload.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url: `/uploads/${req.file.filename}` });
  }
);
//_______________nampiagna_________________________

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const { category, available, featured, search } = req.query;
    const where = {};
    if (category)                where.category  = category;
    if (available !== undefined) where.available = available === 'true';
    if (featured  !== undefined) where.featured  = featured  === 'true';
    if (search)                  where.name      = { [Op.like]: `%${search}%` };

    const items = await MenuItem.findAll({
      where,
      include: [{
        model: User, as: 'lastModifiedBy',
        attributes: ['id','name','role'],
        required: false
      }],
      order: [['featured','DESC'],['category','ASC'],['name','ASC']]
    });
    res.json({ items });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/menu/categories
router.get('/categories', async (_req, res) => {
  try {
    const { fn, col } = require('sequelize');
    const rows = await MenuItem.findAll({
      attributes: [[fn('DISTINCT', col('category')), 'category']],
      raw: true
    });
    res.json({ categories: rows.map(r => r.category) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const item = await MenuItem.findByPk(id, {
      include: [{ model: User, as: 'lastModifiedBy', attributes: ['id','name','role'], required: false }]
    });
    if (!item) return res.status(404).json({ message: 'Plat introuvable.' });
    res.json({ item });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/menu
router.post('/', authenticate, authorize('admin','employee'), async (req, res) => {
  try {
    const item = await MenuItem.create({ ...req.body, lastModifiedById: req.user.id });
    await logActivity(req.user.id, 'menu_create', `Plat ajouté: ${item.name}`);
    req.io.to('staff-room').emit('menu-updated', { action: 'create', item });
    res.status(201).json({ item, message: 'Plat ajouté.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/menu/:id
router.put('/:id', authenticate, authorize('admin','employee'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const item = await MenuItem.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Plat introuvable.' });

    await item.update({ ...req.body, lastModifiedById: req.user.id });
    await logActivity(req.user.id, 'menu_update', `Plat modifié: ${item.name}`);
    req.io.to('staff-room').emit('menu-updated', { action: 'update', item });
    res.json({ item, message: 'Plat modifié.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/menu/:id
router.delete('/:id', authenticate, authorize('admin','employee'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const item = await MenuItem.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Plat introuvable.' });

    const name = item.name;
    await item.destroy();
    await logActivity(req.user.id, 'menu_delete', `Plat supprimé: ${name}`);
    req.io.to('staff-room').emit('menu-updated', { action: 'delete', itemId: id });
    res.json({ message: 'Plat supprimé.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
