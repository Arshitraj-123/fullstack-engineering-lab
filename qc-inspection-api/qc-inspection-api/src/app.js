const path = require('path');
const express = require('express');
const morgan = require('morgan');

const productsRoutes = require('./routes/products.routes');
const debugRoutes = require('./routes/debug.routes');
const requireJsonContentType = require('./middleware/requireJsonContentType');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/products', requireJsonContentType, express.json(), productsRoutes);
  app.use('/api/_debug', debugRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
