const path = require('path');
const express = require('express');
const morgan = require('morgan');

const booksRouter = require('./routes/books.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/books', booksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
