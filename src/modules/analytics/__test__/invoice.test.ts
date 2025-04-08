import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import { InvoiceAnalytics } from '../analytics.service';

const userId = faker.number.int();
const email = faker.internet.email()

const authUser = { id: userId, email };

const injectWithAuth = (fastify: any, type: string) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/invoices?type=${type}`,
    headers: {
      'Authorization': 'Bearer mocked-token'
    },
  });

test('✅ Should return late payment invoices', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(InvoiceAnalytics.prototype, 'latePaymentsInvoices', [
    {
      id: 1,
      clientId: 101,
      totalAmount: 1500,
      dueDate: '2025-03-15',
      paymentDate: '2025-03-20',
      amountPaid: 1500
    }
  ]);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'late');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.invoice.length, 1);
  t.match(res.json().data.invoice[0], {
    id: 1,
    amountPaid: 1500
  });

  stub.restore();
  fastify.close();
});

test('✅ Should return unpaid invoices', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(InvoiceAnalytics.prototype, 'unpaidInvoices', [
    { invoiceId: 201 },
    { invoiceId: 202 }
  ]);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'unpaid');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.invoice.length, 2);
  t.match(res.json().data.invoice[1], { invoiceId: 202 });

  stub.restore();
  fastify.close();
});

test('❌ Should return 400 for unknown invoice type', async (t) => {
  const fastify = build();

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invalid-type');

  t.equal(res.statusCode, 400);
  t.match(res.json(), { message: 'Group by query is unknown' });

  fastify.close();
});
