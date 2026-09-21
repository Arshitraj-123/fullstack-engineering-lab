const CATEGORIES = ['Electronics', 'Apparel', 'Grocery', 'Toys', 'Other'];

const productSchema = {
  name: { type: 'string', required: true, min: 2, max: 80 },
  sku: {
    type: 'string',
    required: true,
    pattern: /^[A-Z]{3}-\d{4}$/,
    patternMessage: 'must look like ABC-1234 (three letters, a dash, four digits)',
  },
  price: { type: 'number', required: true, min: 0.01, max: 999999 },
  quantity: { type: 'integer', required: true, min: 0, max: 1000000 },
  category: { type: 'enum', required: true, enumValues: CATEGORIES },
  contactEmail: { type: 'email', required: true },
};

module.exports = { productSchema, CATEGORIES };
