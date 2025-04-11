import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const userId = faker.number.int();
const email = faker.internet.email();

const authUser = { id: userId, email };

const mockClients = [
  {
    id: faker.number.int(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    phone_number: faker.phone.number(),
  },
  {
    id: faker.number.int(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    phone_number: faker.phone.number(),
  }
];

const injectWithAuth = (fastify: any) =>
  fastify.inject({
    method: 'GET',
    url: '/api/v1/clients',
    headers: {
      Authorization: 'Bearer mocked-token',
    },
  });

test('✅ Should return all clients', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'getAll', mockClients);
  
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

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 200);
  t.equal(res.json().message, 'Clients retrieved successfully');
  t.same(res.json().data.clients, mockClients);
});

test('❌ Should return 500 if service throws', async (t) => {
  const fastify = build();

  const stub = ImportMock.mockFunction(ClientService, 'getAll').rejects(new Error('Something went wrong'));

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

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 500);
  t.match(res.body, /Something went wrong/);
});
