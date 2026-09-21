const { randomUUID } = require('crypto');

/**
 * In-memory "database" for the book catalog.
 * Swappable for a real database later without touching the controllers,
 * since every method here returns plain objects.
 */

function seedBooks() {
  return [
    {
      id: randomUUID(),
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedYear: 2008,
      available: true,
    },
    {
      id: randomUUID(),
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      isbn: '9780201616224',
      publishedYear: 1999,
      available: true,
    },
    {
      id: randomUUID(),
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '9781449373320',
      publishedYear: 2017,
      available: false,
    },
  ];
}

let books = seedBooks();

function findAll({ author, available } = {}) {
  return books.filter((book) => {
    const matchesAuthor = author
      ? book.author.toLowerCase().includes(String(author).toLowerCase())
      : true;
    const matchesAvailability =
      available === undefined ? true : book.available === (available === 'true');
    return matchesAuthor && matchesAvailability;
  });
}

function findById(id) {
  return books.find((book) => book.id === id);
}

function create({ title, author, isbn, publishedYear }) {
  const book = {
    id: randomUUID(),
    title,
    author,
    isbn,
    publishedYear,
    available: true,
  };
  books.push(book);
  return book;
}

function update(id, updates) {
  const book = findById(id);
  if (!book) return null;
  Object.assign(book, updates);
  return book;
}

function remove(id) {
  const index = books.findIndex((book) => book.id === id);
  if (index === -1) return false;
  books.splice(index, 1);
  return true;
}

/** Test helper: restore the store to its original seeded state. */
function reset() {
  books = seedBooks();
}

module.exports = { findAll, findById, create, update, remove, reset };
