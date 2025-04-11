import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import { ExpenseAnalytics } from '../analytics.service';
import { RevenueAnalytics } from '../analytics.service';

const userId = faker.number.int();
const email = faker.internet.email()

const authUser = { id: userId, email };

const injectWithAuth = (fastify: any, type: string) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/expenses?type=${type}`,
    headers: {
      'Authorization': 'Bearer mocked-token'
    },
  });

test('✅ Should return total expenses', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'totalExpenses', { total: 3500 });
  
  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'total');

  t.equal(res.statusCode, 200);
  t.match(res.json().data.expense, { total: 3500 });
});

test('✅ Should return category expenses', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'categoryExpenses', [
    { category: 'Travel', total: 1200 },
    { category: 'Software', total: 2300 }
  ]);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'category');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.expense.length, 2);
});

test('✅ Should return expense trend', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'trendExpenses', [
    { month: '2025-03', total: 1500 },
    { month: '2025-04', total: 2000 }
  ]);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'trend');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.expense.length, 2);
});

test('✅ Should return revenue-to-expense ratio', async (t) => {
  const fastify = build();

  const totalRevenueStub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'totalRevenue', { total: 10000 });
  const totalExpensesStub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'totalExpenses', { total: 2500 });

  const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'ratioExpenses', {
    ratio: 0.25,
  });
  t.teardown(async () => {
    stub.restore()
    totalRevenueStub.restore()
    totalExpensesStub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'ratio');

  t.equal(res.statusCode, 200);
  t.match(res.json().data.expense, { ratio: 0.25 });
});

test('❌ Should return 400 for unknown expense type', async (t) => {
  const fastify = build();

  t.teardown(async () => {
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invalid-type');

  t.equal(res.statusCode, 400);
  t.match(res.json(), { message: 'Group by query is unknown' });
});
