import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import { ReminderAnalytics } from '../analytics.service';

const userId = faker.number.int();
const email = faker.internet.email()

const authUser = { id: userId, email };

const injectWithAuth = (fastify: any, type: string, invoiceId?: number) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/reminders?type=${type}${invoiceId ? `&invoiceId=${invoiceId}` : ''}`,
    headers: {
      'Authorization': 'Bearer mocked-token'
    },
  });

test('✅ Should return total sent reminders', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ReminderAnalytics.prototype, 'totalSentReminders', {
    count: 5
  });

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'total-sent');

  t.equal(res.statusCode, 200);
  t.same(res.json().data.reminder.count, 5);
});

test('✅ Should return invoice reminders', async (t) => {
  const fastify = build();

  const fakeInvoiceId = faker.number.int();

  const stub = ImportMock.mockFunction(ReminderAnalytics.prototype, 'invoiceReminders', [
    { id: 1, invoiceId: fakeInvoiceId, sentAt: '2025-04-01T12:00:00Z' },
    { id: 2, invoiceId: fakeInvoiceId, sentAt: '2025-04-05T12:00:00Z' }
  ]);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
   
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invoice', fakeInvoiceId);

  t.equal(res.statusCode, 200);
  t.same(res.json().data.reminder.length, 2);
  t.match(res.json().data.reminder[0], { invoiceId: fakeInvoiceId });
});

test('❌ Should return 400 if invoice type is used without invoiceId', async (t) => {
  const fastify = build();

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }

  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invoice');

  t.equal(res.statusCode, 400);
  t.match(res.json(), { message: 'invoiceId is required' });
});

test('❌ Should return 400 for unknown reminder type', async (t) => {
  const fastify = build();

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, 'invalid-type');

  t.equal(res.statusCode, 400);
  t.match(res.json(), { message: 'Group by query is unknown' });
});
