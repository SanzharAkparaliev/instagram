require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const apiRoutes = require('./routes/api.routes');

// Models import (associations)
require('./models/user.model');
require('./models/account.model');
require('./models/post.model');
const { initDefaults: initSettings } = require('./models/setting.model');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route табылган жок' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ичинки сервер катасы' });
});

// DB sync + start
sequelize
  .sync({ alter: false })
  .then(async () => {
    console.log('✅ Database туташты');
    await initSettings();

    // Admin user автоматтык түрдө түзүү
    const User = require('./models/user.model');
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@crm.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Default admin түзүлдү: admin@crm.com / admin123');
    }

    // Автоматтык тазалоо — ар 24 саат сайын, 30 күндөн эски лид эмес комментарийлер
    const { Op } = require('sequelize');
    const { Comment } = require('./models/post.model');
    const { Post } = require('./models/post.model');
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deleted = await Comment.destroy({ where: { is_lead: false, parsed_at: { [Op.lt]: cutoff } } });
        if (deleted > 0) console.log(`🗑️ Тазалоо: ${deleted} эски комментарий өчүрүлдү`);
      } catch (e) { console.error('Тазалоо катасы:', e.message); }
    }, 24 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database туташпады:', err.message);
    process.exit(1);
  });

module.exports = app;
