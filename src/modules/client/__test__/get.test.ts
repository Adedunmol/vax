import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const email = faker.internet.email();

const authUser = { id: userId, email };

const mockClient = {
  id: faker.number.int(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  phone_number: faker.phone.number(),
};

const injectWithAuth = (fastify: any, clientId?: number) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/clients/${clientId !== undefined ? clientId : ''}`,
    headers: {
      Authorization: 'Bearer mocked-token',
    },
  });

test('✅ Should retrieve a client successfully', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'get', mockClient);

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

  const res = await injectWithAuth(fastify, mockClient.id);

  t.equal(res.statusCode, 200);
  t.same(res.json().data, mockClient);
  t.equal(res.json().message, 'Client retrieved successfully');
});

test('❌ Should return 400 if clientId is not provided', async (t) => {
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

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 400);
  t.same(res.json(), { message: 'clientId is required' });
});

test('❌ Should return 404 if client is not found', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'get', null);

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

  const res = await injectWithAuth(fastify, 999);

  t.equal(res.statusCode, 404);
  t.same(res.json(), { message: 'No client found with the id' });
});

test('❌ Should return 500 on unexpected server error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'get').rejects(new Error('Unexpected DB error'));

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

  const res = await injectWithAuth(fastify, mockClient.id);

  t.equal(res.statusCode, 500);
  t.match(res.body, /Unexpected DB error/);
});
