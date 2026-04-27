const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { User, Order, OrderItem } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

const staff = [authenticate, authorize('employee','admin')];

// GET /api/employee/clients
router.get('/clients', staff, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = { role: 'client' };
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt','DESC']],
      limit:  +limit,
      offset: (+page - 1) * +limit
    });
    res.json({ clients: rows, total: count, pages: Math.ceil(count / +limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/employee/clients/:id
router.get('/clients/:id', staff, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id))
      return res.status(400).json({ message: 'ID invalide.' });

    const client = await User.findOne({
      where: { id, role: 'client' },
      attributes: { exclude: ['password'] }
    });
    if (!client) return res.status(404).json({ message: 'Client introuvable.' });

    const orders = await Order.findAll({
      where: { clientId: client.id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt','DESC']]
    });

    await logActivity(req.user.id, 'view_client', `Profil consulté: ${client.email}`);
    res.json({ client, orders });
  } catch (e) {
    console.error('employee/clients/:id error:', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
