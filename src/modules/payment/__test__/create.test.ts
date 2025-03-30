import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import paymentService from '../payment.service';

const url = '/api/v1/payments';
const userId = Math.floor(Math.random() * 1000);
const invoice_id = Math.floor(Math.random() * 1000);
const amount = faker.number.float({ min: 1, max: 1000 });
const payment_method = faker.helpers.arrayElement(['bank_transfer', 'cash', 'online_payment', 'crypto']);
const payment_date = new Date().toISOString();

const createPaymentStub = ImportMock.mockFunction(paymentService, 'create', {
  id: Math.floor(Math.random() * 1000),
  invoice_id,
  amount,
  payment_method,
  payment_date,
  userId
});

test('✅ Should create a payment successfully', async (t) => {
  const fastify = build();
  
  t.teardown(() => {
    fastify.close();
    createPaymentStub.restore();
  });
  
  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: {
      invoice_id,
      amount,
      payment_method,
      payment_date,
    },
    headers: { authorization: `Bearer valid_token` },
  });

  t.equal(response.statusCode, 201);
  t.same(response.json(), {
    message: 'Payment created successfully',
    data: {
      id: createPaymentStub.returns[0].id,
      invoice_id,
      amount,
      payment_method,
      payment_date,
      userId,
    },
  });
});

test('❌ Should return 400 for missing required fields', async (t) => {
  const fastify = build();
  
  t.teardown(() => fastify.close());
  
  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: {},
    headers: { authorization: `Bearer valid_token` },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /invoice_id is required/);
});

test('❌ Should return 400 for invalid amount', async (t) => {
  const fastify = build();
  
  t.teardown(() => fastify.close());
  
  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: {
      invoice_id,
      amount: -5,
      payment_method,
      payment_date,
    },
    headers: { authorization: `Bearer valid_token` },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /amount must be greater than 0/);
});

test('❌ Should return 400 for invalid date format', async (t) => {
  const fastify = build();
  
  t.teardown(() => fastify.close());
  
  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: {
      invoice_id,
      amount,
      payment_method,
      payment_date: 'invalid-date',
    },
    headers: { authorization: `Bearer valid_token` },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Invalid payment_date format/);
});

test('❌ Should return 500 on server error', async (t) => {
  const fastify = build();
  
  const failingStub = ImportMock.mockFunction(paymentService, 'create', () => {
    throw new Error('Database error');
  });
  
  t.teardown(() => {
    fastify.close();
    failingStub.restore();
  });
  
  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: {
      invoice_id,
      amount,
      payment_method,
      payment_date,
    },
    headers: { authorization: `Bearer valid_token` },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
