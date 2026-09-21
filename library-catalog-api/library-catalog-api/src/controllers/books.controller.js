const booksStore = require('../data/booksStore');
const ApiError = require('../utils/ApiError');
const { validateBookPayload } = require('../utils/validateBookPayload');

function listBooks(req, res) {
  const { author, available } = req.query;
  const books = booksStore.findAll({ author, available });
  res.status(200).json({ data: books, count: books.length });
}

function getBook(req, res) {
  const book = booksStore.findById(req.params.id);
  if (!book) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  res.status(200).json({ data: book });
}

function createBook(req, res) {
  validateBookPayload(req.body);
  const book = booksStore.create(req.body);
  res.status(201).json({ data: book });
}

function replaceBook(req, res) {
  const existing = booksStore.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  validateBookPayload(req.body);
  const updated = booksStore.update(req.params.id, {
    title: req.body.title,
    author: req.body.author,
    isbn: req.body.isbn,
    publishedYear: req.body.publishedYear,
    available: req.body.available ?? existing.available,
  });
  res.status(200).json({ data: updated });
}

function updateBook(req, res) {
  const existing = booksStore.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  validateBookPayload(req.body, { partial: true });
  const updated = booksStore.update(req.params.id, req.body);
  res.status(200).json({ data: updated });
}

function deleteBook(req, res) {
  const deleted = booksStore.remove(req.params.id);
  if (!deleted) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  res.status(204).send();
}

function checkoutBook(req, res) {
  const book = booksStore.findById(req.params.id);
  if (!book) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  if (!book.available) {
    throw ApiError.badRequest(`"${book.title}" is already checked out`);
  }
  const updated = booksStore.update(req.params.id, { available: false });
  res.status(200).json({ data: updated });
}

function returnBook(req, res) {
  const book = booksStore.findById(req.params.id);
  if (!book) {
    throw ApiError.notFound(`No book found with id ${req.params.id}`);
  }
  if (book.available) {
    throw ApiError.badRequest(`"${book.title}" was not checked out`);
  }
  const updated = booksStore.update(req.params.id, { available: true });
  res.status(200).json({ data: updated });
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  replaceBook,
  updateBook,
  deleteBook,
  checkoutBook,
  returnBook,
};
