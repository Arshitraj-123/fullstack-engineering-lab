const { randomUUID } = require('crypto');

/**
 * File bytes are written to disk by multer; this store only tracks the
 * manifest (who uploaded what, under which stored filename, when).
 * Swapping this for a real database would only touch this file.
 */

let files = [];

function create({ originalName, storedName, mimeType, size }) {
  const record = {
    id: randomUUID(),
    originalName,
    storedName,
    mimeType,
    size,
    uploadedAt: new Date().toISOString(),
  };
  files.push(record);
  return record;
}

function findAll() {
  return [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function findById(id) {
  return files.find((file) => file.id === id);
}

function remove(id) {
  const index = files.findIndex((file) => file.id === id);
  if (index === -1) return null;
  const [removed] = files.splice(index, 1);
  return removed;
}

function reset() {
  files = [];
}

module.exports = { create, findAll, findById, remove, reset };
