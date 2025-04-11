import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ExpenseService from '../expenses.service';

const userId = faker.number.int();
const authUser = { id: userId, email: faker.internet.email() };

const injectWithAuth = (fastify: any, expenseId: number | string) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/expenses/${expenseId}`,
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  });

test('✅ Should get an expense successfully', async (t) => {
  const fastify = build();

  const mockExpense = {
    id: faker.number.int(),
    category: 'Groceries',
    amount: '150.00',
    expenseDate: new Date()
  };

  const stub = ImportMock.mockFunction(ExpenseService, 'get', mockExpense);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, mockExpense.id);

  t.equal(res.statusCode, 200);
  t.match(res.json(), {
    message: 'Expense retrieved successfully',
    data: { id: mockExpense.id, category: 'Groceries' }
  });
});

test('❌ Should return 400 if expenseId param is missing', async (t) => {
  const fastify = build();

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/expenses/',
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  });

  t.equal(res.statusCode, 404); // Because missing route param falls through route match
});

test('❌ Should return 404 if no expense found', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseService, 'get', null);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const fakeExpenseId = faker.number.int();

  const res = await injectWithAuth(fastify, fakeExpenseId);

  t.equal(res.statusCode, 404);
  t.match(res.json(), { message: 'No expense found with the id' });
});

test('🧨 Should handle internal server error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ExpenseService, 'get', () => {
    throw new Error('Unexpected DB error');
  });

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, faker.number.int());

  t.equal(res.statusCode, 500);
  t.match(res.json(), { message: 'Unexpected DB error' });
});
