import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ExpenseService from '../expenses.service';

const userId = faker.number.int();
const authUser = { id: userId, email: faker.internet.email() };

const injectWithAuth = (fastify: any, payload: any) =>
  fastify.inject({
    method: 'POST',
    url: '/api/v1/expenses',
    headers: {
      Authorization: 'Bearer mocked-token'
    },
    payload
  });

test('✅ Should create an expense successfully', async (t) => {
  const fastify = build();

  const mockExpense = {
    id: faker.number.int(),
    category: 'Utilities',
    amount: '100.00',
    expenseDate: new Date()
  };

  const stub = ImportMock.mockFunction(ExpenseService, 'create', mockExpense);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const payload = {
    category: 'Utilities',
    amount: 100,
    expense_date: new Date().toISOString()
  };

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 201);
  t.match(res.json().data, { id: mockExpense.id, category: 'Utilities', amount: '100.00' });

  stub.restore();
  await fastify.close();
});

test('❌ Should fail if category is missing', async (t) => {
  const fastify = build();

  const payload = {
    amount: 50,
    expense_date: new Date().toISOString()
  };

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 400);
  t.match(res.json(), { error: "category is required" });

  await fastify.close();
});

test('❌ Should fail if amount is missing', async (t) => {
  const fastify = build();

  const payload = {
    category: 'Food',
    expense_date: new Date().toISOString()
  };

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 400);
  t.match(res.json(), { error: "amount is required" });

  await fastify.close();
});

test('❌ Should fail if expense_date is invalid', async (t) => {
  const fastify = build();

  const payload = {
    category: 'Transport',
    amount: 20,
    expense_date: 'invalid-date'
  };

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 400);
  t.match(res.json(), { error: "Invalid expense_date format" });

  await fastify.close();
});

test('🧨 Should handle internal server error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseService, 'create', () => {
    throw new Error('DB connection failed');
  });

  const payload = {
    category: 'Misc',
    amount: 20,
    expense_date: new Date().toISOString()
  };

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 500);
  t.match(res.json(), { message: 'DB connection failed' });

  stub.restore();
  await fastify.close();
});
