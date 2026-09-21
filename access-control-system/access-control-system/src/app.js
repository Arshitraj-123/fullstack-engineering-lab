const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
