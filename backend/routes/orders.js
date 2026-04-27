const express  = require('express');
const router   = express.Router();
const { sequelize, Order, OrderItem, OrderStatusHistory, MenuItem, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

const orderIncludes = [
  { model: User,     as: 'client',        attributes: ['id','name','email','phone','address'] },
  { model: User,     as: 'validatedBy',   attributes: ['id','name','role'], required: false },
  { model: OrderItem,as: 'items' },
  { model: OrderStatusHistory, as: 'statusHistory', separate: true, order: [['createdAt','ASC']] }
];

// POST /api/orders — client only
router.post('/', authenticate, authorize('client'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, orderType, deliveryAddress, paymentMethod, clientNote } = req.body;
    if (!items || !items.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Panier vide.' });
    }

    let subtotal = 0;
    const enriched = [];

    for (const it of items) {
      // FIX: accepter menuItem comme integer ou string, parser en integer
      const menuItemId = parseInt(it.menuItem);
      if (!menuItemId || isNaN(menuItemId)) {
        await t.rollback();
        return res.status(400).json({ message: `ID de plat invalide: ${it.menuItem}` });
      }

      const m = await MenuItem.findByPk(menuItemId, { transaction: t });
      if (!m) {
        await t.rollback();
        return res.status(404).json({ message: `Plat introuvable (id: ${menuItemId})` });
      }
      if (!m.available) {
        await t.rollback();
        return res.status(400).json({ message: `"${m.name}" n'est plus disponible.` });
      }

      const price = parseFloat(m.price);
      subtotal += price * it.quantity;
      enriched.push({ menuItemId: m.id, name: m.name, price, quantity: it.quantity });
    }

    const deliveryFee = orderType === 'delivery' ? 3000 : 0;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      clientId:        req.user.id,
      orderType,
      deliveryAddress: deliveryAddress || req.user.address || '',
      paymentMethod,
      clientNote:      clientNote || '',
      subtotal,
      deliveryFee,
      total
    }, { transaction: t });

    await OrderItem.bulkCreate(
      enriched.map(it => ({ ...it, orderId: order.id })),
      { transaction: t }
    );

    await OrderStatusHistory.create({
      orderId:       order.id,
      status:        'pending',
      changedById:   req.user.id,
      changedByRole: 'client'
    }, { transaction: t });

    for (const it of enriched) {
      await MenuItem.increment('totalOrders', {
        by: it.quantity,
        where: { id: it.menuItemId },
        transaction: t
      });
    }

    await t.commit();

    const full = await Order.findByPk(order.id, { include: orderIncludes });
    await logActivity(req.user.id, 'order_create', `Commande ${order.orderNumber} — ${total} Ar`);
    req.io.to('staff-room').emit('new-order', full);

    res.status(201).json({ order: full, message: 'Commande créée.' });
  } catch (e) {
    try { await t.rollback(); } catch (_) {}
    console.error('Order create error:', e);
    res.status(500).json({ message: e.message });
  }
});

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (req.user.role === 'client') where.clientId = req.user.id;
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: orderIncludes,
      order:   [['createdAt','DESC']],
      limit:   +limit,
      offset:  (+page - 1) * +limit,
      distinct: true
    });
    res.json({ orders: rows, total: count, pages: Math.ceil(count / +limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: orderIncludes });
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });
    if (req.user.role === 'client' && order.clientId !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé.' });
    res.json({ order });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/orders/:id/status — employee + admin
router.patch('/:id/status', authenticate, authorize('employee','admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const valid = ['confirmed','preparing','ready','delivered','cancelled'];
    if (!valid.includes(status))
      return res.status(400).json({ message: 'Statut invalide.' });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });

    const updateData = { status };
    if (['confirmed','preparing'].includes(status)) updateData.validatedById = req.user.id;
    await order.update(updateData);

    await OrderStatusHistory.create({
      orderId:       order.id,
      status,
      changedById:   req.user.id,
      changedByRole: req.user.role,
      note:          note || ''
    });

    const full = await Order.findByPk(order.id, { include: orderIncludes });
    await logActivity(req.user.id, 'order_status', `${order.orderNumber} → ${status}`);
    req.io.to(`order-${order.id}`).emit('order-update', { orderId: order.id, status });
    req.io.to('staff-room').emit('order-updated', full);

    res.json({ order: full, message: `Statut: ${status}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/orders/:id/cancel — client
router.patch('/:id/cancel', authenticate, authorize('client'), async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, clientId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });
    if (order.status !== 'pending')
      return res.status(400).json({ message: 'Seules les commandes en attente peuvent être annulées.' });

    await order.update({ status: 'cancelled' });
    await OrderStatusHistory.create({
      orderId: order.id, status: 'cancelled',
      changedById: req.user.id, changedByRole: 'client'
    });
    await logActivity(req.user.id, 'order_cancel', `Commande ${order.orderNumber} annulée`);
    req.io.to('staff-room').emit('order-cancelled', order);
    res.json({ order, message: 'Commande annulée.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/orders/:id/pay
router.patch('/:id/pay', authenticate, async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role === 'client') where.clientId = req.user.id;
    const order = await Order.findOne({ where });
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });
    await order.update({ paymentStatus: 'paid' });
    res.json({ order, message: 'Paiement enregistré.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
