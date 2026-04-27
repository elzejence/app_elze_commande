require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const { sequelize, syncDatabase } = require('./models');

const app    = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET','POST'] }
});

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    // Accepter toutes les origines en développement
    // ou les origines connues
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // accepter quand même en dev
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject io into every request
app.use((req, _res, next) => { req.io = io; next(); });

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/menu',     require('./routes/menu'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', db: 'MySQL', time: new Date() })
);

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: err.message || 'Erreur serveur interne.' });
});

// ── SOCKET.IO EVENTS ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-user',  (uid) => socket.join(`user-${uid}`));
  socket.on('join-order', (oid) => socket.join(`order-${oid}`));
  socket.on('join-staff', ()    => socket.join('staff-room'));
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ MySQL connecté');

      await syncDatabase(); // crée/met à jour les tables automatiquement

      server.listen(PORT, () =>
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
      );
      break;
    } catch (err) {
      console.error(`❌ Erreur démarrage (${retries} tentatives):`, err.message);
      retries--;
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        process.exit(1);
      }
    }
  }
})();
