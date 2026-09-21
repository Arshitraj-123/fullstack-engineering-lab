const request = require('supertest');
const createApp = require('../src/app');
const productsStore = require('../src/data/productsStore');

const app = createApp();

const validProduct = {
  name: 'Desk Lamp',
  sku: 'ELE-5001',
  price: 24.99,
  quantity: 50,
  category: 'Electronics',
  contactEmail: 'ops@example.com',
};

beforeEach(() => {
  productsStore.reset();
});

describe('POST /api/products', () => {
  it('creates a product when the payload is fully valid', async () => {
    const res = await request(app).post('/api/products').send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(validProduct);
    expect(res.body.data.id).toBeDefined();
  });

  it('rejects an incomplete payload with an itemized 400', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(1);
  });

  it('rejects a malformed sku with a pattern violation', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'not-a-sku' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.field === 'sku' && d.rule === 'pattern')).toBe(true);
  });

  it('rejects a category outside the enum', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ ...validProduct, category: 'Vehicles' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.field === 'category' && d.rule === 'enum')).toBe(true);
  });

  it('rejects a negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ ...validProduct, price: -5 });
    expect(res.status).toBe(400);
  });

  it('returns 409 for a duplicate SKU', async () => {
    await request(app).post('/api/products').send(validProduct);
    const res = await request(app).post('/api/products').send(validProduct);
    expect(res.status).toBe(409);
    expect(res.body.error.details[0].field).toBe('sku');
  });

  it('returns 415 for a non-JSON content type', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Content-Type', 'text/plain')
      .send('name=Desk Lamp');
    expect(res.status).toBe(415);
  });

  it('returns 400 for malformed JSON rather than crashing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not valid JSON/i);
  });
});

describe('GET /api/products/:id', () => {
  it('404s for an unknown id', async () => {
    const res = await request(app).get('/api/products/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns a known product', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const res = await request(app).get(`/api/products/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.sku).toBe(validProduct.sku);
  });
});

describe('PATCH /api/products/:id', () => {
  it('applies a partial update and still validates the changed field', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const res = await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('quantity');
  });

  it('succeeds with a valid partial update', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const res = await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .send({ quantity: 75 });
    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(75);
    expect(res.body.data.name).toBe(validProduct.name);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const del = await request(app).delete(`/api/products/${created.body.data.id}`);
    expect(del.status).toBe(204);

    const getAfter = await request(app).get(`/api/products/${created.body.data.id}`);
    expect(getAfter.status).toBe(404);
  });

  it('404s deleting an unknown id', async () => {
    const res = await request(app).delete('/api/products/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('unmatched routes', () => {
  it('returns a JSON 404 rather than the default HTML error page', async () => {
    const res = await request(app).get('/api/not-a-real-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('error simulation endpoints', () => {
  it('returns a generic 500 for a synchronous failure, without leaking the real message', async () => {
    const res = await request(app).get('/api/_debug/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
    expect(res.body.error.message).not.toMatch(/Simulated/);
  });

  it('returns a generic 500 for an async/rejected-promise failure', async () => {
    const res = await request(app).get('/api/_debug/async-boom');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
  });
});
