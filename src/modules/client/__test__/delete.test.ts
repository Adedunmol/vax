import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const clientId = faker.number.int();
const authUser = { id: userId, email: faker.internet.email() };

const mockClient = {
  id: clientId,
  createdBy: userId,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  phoneNumber: faker.phone.number()
};

const injectWithAuth = (fastify: any, idParam?: number) =>
  fastify.inject({
    method: 'DELETE',
    url: `/api/v1/clients/${idParam ?? ''}`,
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  });

test('✅ Should delete client successfully', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'delete', mockClient);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId);

  t.equal(res.statusCode, 200);
  t.equal(res.json().message, 'Client deleted successfully');
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

  const res = await injectWithAuth(fastify, undefined);

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /clientId is required/);

  fastify.close();
});

test('❌ Should return 404 if client does not exist', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'delete').resolves(null);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId);

  t.equal(res.statusCode, 404);
  t.match(res.json().message, /No client found/);

  stub.restore();
  fastify.close();
});

test('❌ Should return 500 if service throws error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'delete').rejects(new Error('Something went wrong'));

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, clientId);

  t.equal(res.statusCode, 500);
  t.match(res.body, /Something went wrong/);

  stub.restore();
  fastify.close();
});
