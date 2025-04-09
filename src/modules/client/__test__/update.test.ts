import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const email = faker.internet.email();
const clientId = faker.number.int();
const authUser = { id: userId, email };

const validPayload = {
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  phone_number: faker.phone.number()
};

const mockClient = {
  id: clientId,
  createdBy: userId,
  ...validPayload,
};

const injectWithAuth = (fastify: any, idParam?: number, body?: any) =>
  fastify.inject({
    method: 'PATCH',
    url: `/api/v1/clients/${idParam ?? ''}`,
    payload: body,
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  });

test('✅ Should update client successfully', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'update', mockClient);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId, validPayload);

  t.equal(res.statusCode, 200);
  t.equal(res.json().message, 'Client updated successfully');
  t.same(res.json().data, mockClient);

  stub.restore();
  fastify.close();
});

test('❌ Should return 400 if clientId param is missing', async (t) => {
  const fastify = build();

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, undefined, validPayload);

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /clientId is required/);

  fastify.close();
});

test('❌ Should return 400 if payload has invalid email', async (t) => {
  const fastify = build();

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId, {
    ...validPayload,
    email: 'invalid-email'
  });

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /email/);

  fastify.close();
});

test('❌ Should return 500 if service throws error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'update').rejects(new Error('Something broke'));

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId, validPayload);

  t.equal(res.statusCode, 500);
  t.match(res.body, /Something broke/);

  stub.restore();
  fastify.close();
});
