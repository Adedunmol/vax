import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import { RevenueAnalytics } from '../analytics.service';

const userId = faker.number.int();
const email = faker.internet.email()

const authUser = { id: userId, email };

// Helper to inject with auth
const injectWithAuth = (fastify: any, type: string) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/revenues?type=${type}`,
    headers: {
      // You might use a real auth header if needed; mocked user for now
      'Authorization': `Bearer mocked-token`
    },
  });

test('✅ Should return total revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'totalRevenue', { total: 5000 });

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'total');

  t.equal(res.statusCode, 200);
  t.match(res.json(), { data: { revenue: { total: 5000 } } });

  stub.restore();
  fastify.close();
});

test('✅ Should return monthly revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'monthlyRevenue', [
    { month: '2025-03', total: 2500 },
    { month: '2025-04', total: 1500 },
  ]);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'monthly');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.revenue.length, 2);

  stub.restore();
  fastify.close();
});

test('✅ Should return outstanding revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'outstandingRevenue', {
    totalOutstanding: 1200,
  });

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'outstanding');

  t.equal(res.statusCode, 200);
  t.match(res.json().data.revenue, { totalOutstanding: 1200 });

  stub.restore();
  fastify.close();
});

test('✅ Should return average revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'averageRevenue', {
    avgRevenue: 1350,
  });

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'average');

  t.equal(res.statusCode, 200);
  t.match(res.json().data.revenue, { avgRevenue: 1350 });

  stub.restore();
  fastify.close();
});

test('✅ Should return top clients revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'topClientsRevenue', [
    { client: 'John Doe', totalSpent: 2000 },
    { client: 'Jane Smith', totalSpent: 1800 },
  ]);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'top-clients');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.revenue.length, 2);

  stub.restore();
  fastify.close();
});

test('✅ Should return payment methods revenue', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'paymentMethodsRevenue', [
    { method: 'credit_card', total: 3000 },
    { method: 'paypal', total: 1000 },
  ]);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'payment-method');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.revenue.length, 2);

  stub.restore();
  fastify.close();
});

test('❌ Should return 400 for unknown revenue type', async (t) => {
  const fastify = build();

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invalid-type');

  t.equal(res.statusCode, 400);
  t.match(res.json(), { message: 'Revenue type is unknown' });

  fastify.close();
});
