import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import paymentService from '../payment.service';

const url = '/api/v1/payments';
const paymentId = Math.floor(Math.random() * 1000);
const userId = Math.floor(Math.random() * 1000);

const paymentMock = {
  id: paymentId,
  invoiceId: faker.number.int(),
  amount: faker.number.float({ min: 10, max: 1000 }),
  paymentMethod: 'bank_transfer',
  paymentDate: new Date().toISOString(),
  userId,
};

const getPaymentStub = ImportMock.mockFunction(paymentService, 'get', paymentMock);

test('✅ Should retrieve a payment successfully', async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getPaymentStub.restore();
  });

  const response = await fastify.inject({
    method: 'GET',
    url: `${url}/${paymentId}`,
    headers: { authorization: `Bearer faketoken` },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), {
    message: 'Payment retrieved successfully',
    data: paymentMock,
  });
});

test('❌ Should return 404 if payment does not exist', async (t) => {
  getPaymentStub.restore();
  const getPaymentStubEmpty = ImportMock.mockFunction(paymentService, 'get', null);
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getPaymentStubEmpty.restore();
  });

  const response = await fastify.inject({
    method: 'GET',
    url: `${url}/99999`,
    headers: { authorization: `Bearer faketoken` },
  });

  t.equal(response.statusCode, 404);
  t.same(response.json(), { message: 'No payment found with the id' });
});

test('❌ Should return 400 if paymentId is missing', async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: 'GET',
    url: `${url}/`,
    headers: { authorization: `Bearer faketoken` },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: 'paymentId is required' });
});
