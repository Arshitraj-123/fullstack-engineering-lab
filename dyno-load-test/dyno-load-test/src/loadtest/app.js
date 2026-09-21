const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { errorHandler, notFound } = require('../utils/errorMiddleware');
const routes = require('./routes');

function createControlApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));
  app.use(express.json());

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'control' }));

  app.use('/api', routes);
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createControlApp;
