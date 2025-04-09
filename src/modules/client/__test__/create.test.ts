import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const email = faker.internet.email();

const authUser = { id: userId, email };

const validClientData = {
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  phone_number: faker.phone.number(),
};

test('✅ Should create a new client successfully', async (t) => {
  const fastify = build();

  const createdClient = { id: 1, ...validClientData };
  const stub = ImportMock.mockFunction(ClientService, 'create', createdClient);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/clients',
    headers: {
      Authorization: 'Bearer mocked-token',
    },
    payload: validClientData,
  });

  t.equal(res.statusCode, 201);
  t.same(res.json().data, createdClient);
  t.equal(res.json().message, 'Client created successfully');

  stub.restore();
  fastify.close();
});

test('❌ Should return 400 if required field is missing', async (t) => {
  const fastify = build();

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const { first_name, ...invalidData } = validClientData;

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/clients',
    headers: {
      Authorization: 'Bearer mocked-token',
    },
    payload: invalidData,
  });

  t.equal(res.statusCode, 400);
  t.match(res.json(), { error: /first_name is required/i });

  fastify.close();
});

test('❌ Should return 409 if email already exists', async (t) => {
  const fastify = build();

  const err = {
    code: '23505',
    detail: '(email)=() already exists',
  };

  const stub = ImportMock.mockFunction(ClientService, 'create').rejects(err);

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/clients',
    headers: {
      Authorization: 'Bearer mocked-token',
    },
    payload: validClientData,
  });

  t.equal(res.statusCode, 409);
  t.same(res.json(), { error: 'email already exists' });

  stub.restore();
  fastify.close();
});

test('❌ Should return 500 on unhandled server error', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'create').rejects(new Error('Unexpected DB error'));

  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/clients',
    headers: {
      Authorization: 'Bearer mocked-token',
    },
    payload: validClientData,
  });

  t.equal(res.statusCode, 500);
  t.match(res.body, /Unexpected DB error/);

  stub.restore();
  fastify.close();
});
