const express  = require('express');
const router   = express.Router();
const { Op, fn, col } = require('sequelize');
const { User, Order, OrderItem, MenuItem, ActivityLog, sequelize } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

const adminOnly = [authenticate, authorize('admin')];

// POST /api/admin/employees
router.post('/employees', adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Nom, email et mot de passe (min. 6 chars) requis.' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé.' });

    const emp = await User.create({ name, email, password, phone, role: 'employee', createdById: req.user.id });
    await logActivity(req.user.id, 'create_employee', `Employé créé: ${emp.email}`);
    res.status(201).json({ user: emp.toSafeJSON(), message: 'Compte employé créé.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 30 } = req.query;
    const where = { role: { [Op.in]: ['client','employee'] } };
    if (role && ['client','employee'].includes(role)) where.role = role;
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id','name'], required: false }],
      attributes: { exclude: ['password'] },
      order: [['createdAt','DESC']],
      limit:  +limit,
      offset: (+page - 1) * +limit
    });
    res.json({ users: rows, total: count, pages: Math.ceil(count / +limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/admin/users/:id
router.get('/users/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: User, as: 'creator', attributes: ['id','name','email'], required: false }]
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const orders = user.role === 'client'
      ? await Order.findAll({
          where: { clientId: user.id },
          include: [{ model: OrderItem, as: 'items' }],
          order: [['createdAt','DESC']],
          limit: 10
        })
      : [];

    res.json({ user, orders });
  } catch (e) {
    console.error('admin/users/:id error:', e);
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Impossible de désactiver un admin.' });

    await user.update({ isActive: !user.isActive });
    await logActivity(req.user.id, 'toggle_user', `${user.isActive ? 'Activé' : 'Désactivé'}: ${user.email}`);
    res.json({ user: user.toSafeJSON(), message: `Compte ${user.isActive ? 'activé' : 'désactivé'}.` });
  } catch (e) {
    console.error('toggle-active error:', e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Impossible de supprimer un admin.' });

    await logActivity(req.user.id, 'delete_user', `Supprimé: ${user.email} (${user.role})`);
    await user.destroy();
    res.json({ message: 'Compte supprimé définitivement.' });
  } catch (e) {
    console.error('delete user error:', e);
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/admin/users/:id/reset-password
router.patch('/users/:id/reset-password', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Min. 6 caractères.' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    await user.update({ password: newPassword });
    await logActivity(req.user.id, 'reset_password', `MDP réinitialisé: ${user.email}`);
    res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/admin/activity
router.get('/activity', adminOnly, async (req, res) => {
  try {
    const { role } = req.query;
    const userWhere = { role: { [Op.in]: role ? [role] : ['employee','client'] } };

    const logs = await ActivityLog.findAll({
      include: [{
        model: User, as: 'user',
        attributes: ['id','name','email','role'],
        where: userWhere,
        required: true
      }],
      order: [['createdAt','DESC']],
      limit: 300
    });
    res.json({ logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/admin/stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const now        = new Date();
    const startDay   = new Date(now); startDay.setHours(0,0,0,0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start7Days = new Date(Date.now() - 7 * 86400000);

    const [
      totalClients, totalEmployees,
      totalOrders, todayOrders, pendingOrders,
      revenueAll, revenueToday, revenueMonth,
      byStatus, last7
    ] = await Promise.all([
      User.count({ where: { role: 'client' } }),
      User.count({ where: { role: 'employee' } }),
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: startDay } } }),
      Order.count({ where: { status: { [Op.in]: ['pending','confirmed','preparing'] } } }),
      Order.findAll({ where: { status: { [Op.ne]: 'cancelled' } }, attributes: [[fn('SUM', col('total')), 'sum']], raw: true }),
      Order.findAll({ where: { status: { [Op.ne]: 'cancelled' }, createdAt: { [Op.gte]: startDay } }, attributes: [[fn('SUM', col('total')), 'sum']], raw: true }),
      Order.findAll({ where: { status: { [Op.ne]: 'cancelled' }, createdAt: { [Op.gte]: startMonth } }, attributes: [[fn('SUM', col('total')), 'sum']], raw: true }),
      Order.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }),
      Order.findAll({
        where: { createdAt: { [Op.gte]: start7Days } },
        attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('COUNT', col('id')), 'orders'], [fn('SUM', col('total')), 'revenue']],
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true
      })
    ]);

    res.json({
      users:   { clients: totalClients, employees: totalEmployees },
      orders:  { total: totalOrders, today: todayOrders, pending: pendingOrders },
      revenue: { total: parseFloat(revenueAll[0]?.sum)||0, today: parseFloat(revenueToday[0]?.sum)||0, month: parseFloat(revenueMonth[0]?.sum)||0 },
      byStatus: byStatus.map(r => ({ _id: r.status, count: parseInt(r.count) })),
      last7:    last7.map(r => ({ _id: r.date, orders: parseInt(r.orders), revenue: parseFloat(r.revenue)||0 }))
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
