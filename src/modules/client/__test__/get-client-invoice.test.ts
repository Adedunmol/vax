import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const email = faker.internet.email();
const clientId = faker.number.int();

const authUser = { id: userId, email };

const mockInvoices = [
  {
    id: faker.number.int(),
    createdFor: clientId,
    createdBy: userId,
    totalAmount: 5000,
    status: 'unpaid',
    dueDate: faker.date.future(),
  },
  {
    id: faker.number.int(),
    createdFor: clientId,
    createdBy: userId,
    totalAmount: 1200,
    status: 'paid',
    dueDate: faker.date.future(),
  },
];

const injectWithAuth = (fastify: any, clientIdParam?: number) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/clients/${clientIdParam ?? ''}/invoices`,
    headers: {
      Authorization: 'Bearer mocked-token',
    },
  });

test('✅ Should return invoices for a client', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'getInvoices', mockInvoices);

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

  const res = await injectWithAuth(fastify, clientId);

  t.equal(res.statusCode, 200);
  t.equal(res.json().message, 'Invoices retrieved successfully');
  t.same(res.json().data.invoices, mockInvoices);
});

test('❌ Should return 400 if clientId is missing', async (t) => {
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

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /clientId is required/);
});

test('❌ Should return 500 if service throws an error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'getInvoices').rejects(new Error('Database failure'));

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

  const res = await injectWithAuth(fastify, clientId);

  t.equal(res.statusCode, 500);
  t.match(res.body, /Database failure/);
});
