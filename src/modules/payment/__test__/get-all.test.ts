import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import PaymentService from '../payment.service';

const url = '/api/v1/payments';
const userId = 123;
const payments = [
  { id: 1, amount: 100, payment_method: 'cash', payment_date: new Date(), invoice_id: 10 },
  { id: 2, amount: 200, payment_method: 'bank_transfer', payment_date: new Date(), invoice_id: 11 }
];

const getAllPaymentsStub = ImportMock.mockFunction(PaymentService, 'getAll', payments);

test("✅ Should retrieve all payments successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getAllPaymentsStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { authorization: `Bearer mockToken` },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Payments retrieved successfully", data: { expenses: payments } });
});

test("✅ Should return an empty array if no payments exist", async (t) => {
  getAllPaymentsStub.restore();
  const emptyStub = ImportMock.mockFunction(PaymentService, 'getAll', []);
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    emptyStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { authorization: `Bearer mockToken` },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Payments retrieved successfully", data: { expenses: [] } });
});

test("❌ Should handle internal server errors", async (t) => {
  getAllPaymentsStub.restore();
  const errorStub = ImportMock.mockFunction(PaymentService, 'getAll', () => { throw new Error('Database error'); });
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { authorization: `Bearer mockToken` },
  });

  t.equal(response.statusCode, 500);
});
