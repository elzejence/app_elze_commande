const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Message, User, Order } = require('../models');
const { authenticate } = require('../middleware/auth');
const { logActivity }  = require('../middleware/logger');

const canCommunicate = (a, b) => {
  const pairs = [['client','employee'],['client','admin'],['employee','admin']];
  return pairs.some(([x,y]) => (a===x&&b===y)||(a===y&&b===x));
};

const msgIncludes = [
  { model: User,  as: 'sender',    attributes: ['id','name','role'] },
  { model: User,  as: 'recipient', attributes: ['id','name','role'] },
  { model: Order, as: 'order',     attributes: ['id','orderNumber','status'], required: false }
];

// POST /api/messages
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipientId, content, type, orderId } = req.body;

    if (!content || !content.trim())
      return res.status(400).json({ message: 'Message vide.' });

    // FIX: recipientId peut arriver comme string ou integer
    const recipId = parseInt(recipientId);
    if (!recipId || isNaN(recipId))
      return res.status(400).json({ message: 'Destinataire requis.' });

    const recipient = await User.findByPk(recipId, {
      attributes: ['id','name','role','isActive']
    });
    if (!recipient)
      return res.status(404).json({ message: 'Destinataire introuvable.' });
    if (!recipient.isActive)
      return res.status(400).json({ message: 'Ce compte est désactivé.' });
    if (!canCommunicate(req.user.role, recipient.role))
      return res.status(403).json({
        message: `Communication non autorisée entre ${req.user.role} et ${recipient.role}.`
      });

    const msg = await Message.create({
      senderId:      req.user.id,
      senderRole:    req.user.role,
      recipientId:   recipId,
      recipientRole: recipient.role,
      content:       content.trim(),
      type:          type || 'general',
      orderId:       orderId ? parseInt(orderId) : null
    });

    const full = await Message.findByPk(msg.id, { include: msgIncludes });
    await logActivity(req.user.id, 'send_message',
      `→ ${recipient.name} (${recipient.role}): "${content.slice(0,40)}"`);

    req.io.to(`user-${recipId}`).emit('new-message', full);
    if (req.user.role === 'client') req.io.to('staff-room').emit('client-message', full);

    res.status(201).json({ message: full });
  } catch (e) {
    console.error('send message error:', e);
    res.status(500).json({ message: e.message });
  }
});

// GET /api/messages/inbox
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const uid = req.user.id;
    const msgs = await Message.findAll({
      where: { [Op.or]: [{ senderId: uid }, { recipientId: uid }] },
      include: msgIncludes,
      order: [['createdAt','DESC']]
    });

    const map = new Map();
    for (const m of msgs) {
      const other = m.senderId === uid ? m.recipient : m.sender;
      if (!other) continue;
      const key = other.id;
      if (!map.has(key)) map.set(key, { contact: other, lastMessage: m, unreadCount: 0 });
      if (m.recipientId === uid && !m.isRead) map.get(key).unreadCount++;
    }

    const conversations = Array.from(map.values());
    const totalUnread   = conversations.reduce((s, c) => s + c.unreadCount, 0);
    res.json({ conversations, totalUnread });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/messages/conversation/:contactId
router.get('/conversation/:contactId', authenticate, async (req, res) => {
  try {
    const uid = req.user.id;
    const cid = parseInt(req.params.contactId);
    if (!cid || isNaN(cid))
      return res.status(400).json({ message: 'ID contact invalide.' });

    const contact = await User.findByPk(cid, {
      attributes: ['id','name','role','email','phone']
    });
    if (!contact) return res.status(404).json({ message: 'Contact introuvable.' });

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: uid, recipientId: cid },
          { senderId: cid, recipientId: uid }
        ]
      },
      include: msgIncludes,
      order: [['createdAt','ASC']]
    });

    // Mark received messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      { where: { senderId: cid, recipientId: uid, isRead: false } }
    );

    res.json({ messages, contact });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/messages/contacts
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const roleMap = {
      client:   ['employee','admin'],
      employee: ['client','admin'],
      admin:    ['client','employee']
    };
    const contacts = await User.findAll({
      where: {
        role:     { [Op.in]: roleMap[req.user.role] || [] },
        isActive: true,
        id:       { [Op.ne]: req.user.id }
      },
      attributes: ['id','name','role','email','phone']
    });
    res.json({ contacts });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/messages/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const msg = await Message.findOne({
      where: { id: parseInt(req.params.id), recipientId: req.user.id }
    });
    if (!msg) return res.status(404).json({ message: 'Message introuvable.' });
    await msg.update({ isRead: true, readAt: new Date() });
    res.json({ message: msg });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
