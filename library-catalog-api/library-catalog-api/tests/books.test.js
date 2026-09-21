const request = require('supertest');
const createApp = require('../src/app');
const booksStore = require('../src/data/booksStore');

const app = createApp();

beforeEach(() => {
  booksStore.reset();
});

describe('GET /api/books', () => {
  it('returns the seeded list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.data).toHaveLength(3);
  });

  it('filters by author', async () => {
    const res = await request(app).get('/api/books?author=Kleppmann');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Designing Data-Intensive Applications');
  });

  it('filters by availability', async () => {
    const res = await request(app).get('/api/books?available=false');
    expect(res.status).toBe(200);
    expect(res.body.data.every((book) => book.available === false)).toBe(true);
  });
});

describe('GET /api/books/:id', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/books/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns a single book', async () => {
    const list = await request(app).get('/api/books');
    const target = list.body.data[0];
    const res = await request(app).get(`/api/books/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(target.id);
  });
});

describe('POST /api/books', () => {
  it('creates a new book', async () => {
    const payload = {
      title: 'Refactoring',
      author: 'Martin Fowler',
      isbn: '9780134757599',
      publishedYear: 2018,
    };
    const res = await request(app).post('/api/books').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(payload);
    expect(res.body.data.available).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('rejects an invalid payload', async () => {
    const res = await request(app).post('/api/books').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

describe('PATCH /api/books/:id', () => {
  it('partially updates a book', async () => {
    const list = await request(app).get('/api/books');
    const target = list.body.data[0];
    const res = await request(app)
      .patch(`/api/books/${target.id}`)
      .send({ title: 'Clean Code (2nd Printing)' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Clean Code (2nd Printing)');
    expect(res.body.data.author).toBe(target.author);
  });
});

describe('DELETE /api/books/:id', () => {
  it('deletes a book', async () => {
    const list = await request(app).get('/api/books');
    const target = list.body.data[0];
    const res = await request(app).delete(`/api/books/${target.id}`);
    expect(res.status).toBe(204);

    const followUp = await request(app).get(`/api/books/${target.id}`);
    expect(followUp.status).toBe(404);
  });
});

describe('checkout / return workflow', () => {
  it('checks out an available book, then blocks a second checkout', async () => {
    const list = await request(app).get('/api/books?available=true');
    const target = list.body.data[0];

    const checkout = await request(app).post(`/api/books/${target.id}/checkout`);
    expect(checkout.status).toBe(200);
    expect(checkout.body.data.available).toBe(false);

    const secondCheckout = await request(app).post(`/api/books/${target.id}/checkout`);
    expect(secondCheckout.status).toBe(400);
  });

  it('returns a checked-out book', async () => {
    const list = await request(app).get('/api/books?available=false');
    const target = list.body.data[0];

    const returned = await request(app).post(`/api/books/${target.id}/return`);
    expect(returned.status).toBe(200);
    expect(returned.body.data.available).toBe(true);
  });
});
