const request = require('supertest');
const app = require('../src/app');

describe('StockSense Backend API Integration Suite', () => {
  let authToken = '';
  const testEmail = `test_${Date.now()}@stocksense.test`;
  const testPassword = 'Password123!';

  describe('Authentication Flow (/auth)', () => {
    it('should reject signup with missing required fields', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: testEmail });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should register a new staff user and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          name: 'Integration Tester',
          email: testEmail,
          password: testPassword,
          role: 'manager',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testEmail);
      authToken = res.body.token;
    });

    it('should fail registration for duplicate email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          name: 'Duplicate Tester',
          email: testEmail,
          password: testPassword,
        });
      expect(res.statusCode).toBe(409);
    });

    it('should authenticate user and return token on valid login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testEmail);
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrong_password',
        });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Security & Authentication Guard', () => {
    it('should reject unauthorized access to /products without token', async () => {
      const res = await request(app).get('/products');
      expect(res.statusCode).toBe(401);
    });

    it('should reject unauthorized access to /warehouses without token', async () => {
      const res = await request(app).get('/warehouses');
      expect(res.statusCode).toBe(401);
    });

    it('should reject unauthorized access to /ledger without token', async () => {
      const res = await request(app).get('/ledger');
      expect(res.statusCode).toBe(401);
    });

    it('should reject unauthorized access to /adjustments without token', async () => {
      const res = await request(app).get('/adjustments');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Products Catalog (/products)', () => {
    let createdProductId = null;
    const testSku = `SKU-${Date.now()}`;

    it('should list products when authenticated', async () => {
      const res = await request(app)
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a new product item with SKU', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Automated Test Product',
          sku: testSku,
          unit_of_measure: 'unit',
          unit_cost: 45.50,
          reorder_point: 10,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.sku).toBe(testSku);
      createdProductId = res.body.id;
    });

    it('should prevent creating duplicate SKU', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicate SKU Product',
          sku: testSku,
        });
      expect(res.statusCode).toBe(409);
    });
  });

  describe('Warehouses & Locations (/warehouses)', () => {
    it('should list warehouses when authenticated', async () => {
      const res = await request(app)
        .get('/warehouses')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a warehouse with automatic default location', async () => {
      const res = await request(app)
        .post('/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Test Facility ${Date.now()}`,
          address: '42 Test Industrial Ave',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');

      // Verify default location was provisioned
      const locRes = await request(app)
        .get(`/warehouses/${res.body.id}/locations`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(locRes.statusCode).toBe(200);
      expect(locRes.body.length).toBeGreaterThan(0);
    });
  });

  describe('Move History Ledger (/ledger)', () => {
    it('should return movement entries array', async () => {
      const res = await request(app)
        .get('/ledger')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Inventory Adjustments (/adjustments)', () => {
    it('should validate required fields when recording adjustment', async () => {
      const res = await request(app)
        .post('/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: 1 });
      expect(res.statusCode).toBe(400);
    });

    it('should reject negative counted quantities', async () => {
      const res = await request(app)
        .post('/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 1,
          location_id: 1,
          counted_qty: -5,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/negative/i);
    });
  });
});
