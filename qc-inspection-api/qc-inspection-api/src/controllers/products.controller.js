const productsStore = require('../data/productsStore');
const { validate } = require('../validation/validate');
const { productSchema } = require('../schemas/product.schema');
const ApiError = require('../utils/ApiError');

function normalize(body) {
  // Numbers arrive as numbers from JSON already, but a form-style client
  // (or a curl -d with quoted numbers) might send strings — coerce the
  // numeric fields once, here, so the validator sees the real type.
  const normalized = { ...body };
  if (normalized.price !== undefined) normalized.price = Number(normalized.price);
  if (normalized.quantity !== undefined) normalized.quantity = Number(normalized.quantity);
  if (typeof normalized.sku === 'string') normalized.sku = normalized.sku.trim().toUpperCase();
  if (typeof normalized.name === 'string') normalized.name = normalized.name.trim();
  return normalized;
}

function listProducts(req, res) {
  const products = productsStore.findAll();
  res.status(200).json({ data: products, count: products.length });
}

function getProduct(req, res) {
  const product = productsStore.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound(`No product found with id ${req.params.id}`);
  }
  res.status(200).json({ data: product });
}

function createProduct(req, res) {
  const payload = normalize(req.body);
  validate(productSchema, payload);

  if (productsStore.findBySku(payload.sku)) {
    throw ApiError.conflict(`SKU "${payload.sku}" is already assigned to another product`, [
      { field: 'sku', rule: 'unique', message: `sku "${payload.sku}" is already in use` },
    ]);
  }

  const product = productsStore.create(payload);
  res.status(201).json({ data: product });
}

function replaceProduct(req, res) {
  const existing = productsStore.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound(`No product found with id ${req.params.id}`);
  }

  const payload = normalize(req.body);
  validate(productSchema, payload);

  const clash = productsStore.findBySku(payload.sku, existing.id);
  if (clash) {
    throw ApiError.conflict(`SKU "${payload.sku}" is already assigned to another product`, [
      { field: 'sku', rule: 'unique', message: `sku "${payload.sku}" is already in use` },
    ]);
  }

  const updated = productsStore.update(existing.id, payload);
  res.status(200).json({ data: updated });
}

function patchProduct(req, res) {
  const existing = productsStore.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound(`No product found with id ${req.params.id}`);
  }

  const payload = normalize(req.body);
  validate(productSchema, payload, { partial: true });

  if (payload.sku) {
    const clash = productsStore.findBySku(payload.sku, existing.id);
    if (clash) {
      throw ApiError.conflict(`SKU "${payload.sku}" is already assigned to another product`, [
        { field: 'sku', rule: 'unique', message: `sku "${payload.sku}" is already in use` },
      ]);
    }
  }

  const updated = productsStore.update(existing.id, payload);
  res.status(200).json({ data: updated });
}

function deleteProduct(req, res) {
  const deleted = productsStore.remove(req.params.id);
  if (!deleted) {
    throw ApiError.notFound(`No product found with id ${req.params.id}`);
  }
  res.status(204).send();
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  replaceProduct,
  patchProduct,
  deleteProduct,
};
