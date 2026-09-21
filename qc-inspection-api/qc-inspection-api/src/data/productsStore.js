const { randomUUID } = require('crypto');

let products = [
  {
    id: randomUUID(),
    name: 'Wireless Mouse',
    sku: 'ELE-1001',
    price: 19.99,
    quantity: 140,
    category: 'Electronics',
    contactEmail: 'inventory@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'Cotton T-Shirt',
    sku: 'APP-2001',
    price: 12.5,
    quantity: 300,
    category: 'Apparel',
    contactEmail: 'inventory@example.com',
    createdAt: new Date().toISOString(),
  },
];

function findAll() {
  return [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findById(id) {
  return products.find((product) => product.id === id);
}

function findBySku(sku, excludeId) {
  return products.find((product) => product.sku === sku && product.id !== excludeId);
}

function create(data) {
  const product = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
  products.push(product);
  return product;
}

function update(id, updates) {
  const product = findById(id);
  if (!product) return null;
  Object.assign(product, updates);
  return product;
}

function remove(id) {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
}

function reset() {
  products = [];
}

module.exports = { findAll, findById, findBySku, create, update, remove, reset };
