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
  updated_at: new Date(),
  created_at: new Date(),
  deleted_at: new Date(),
};

const validClientResponse = {
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  phoneNumber: faker.phone.number(),
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  deleted_at: new Date().toISOString(),
  id: 1,
  createdBy: authUser.id
};

const injectWithAuth = async (fastify: any, token: string, data: any) =>
  await fastify.inject({
  method: 'POST',
  url: '/api/v1/clients',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  payload: data === null ? validClientData : data,
});

test('Should create a new client successfully', async (t) => {
  try {
    const fastify = await build();
    await fastify.ready()
  
    const createdClient = { id: 1, ...validClientData };
    const stub = ImportMock.mockFunction(ClientService, 'create', validClientResponse);
  
    t.teardown(async () => {
      stub.restore()
      await fastify.close()
    })
  
    const res = await injectWithAuth(fastify, fastify.jwt.sign(authUser), null)
  
    t.equal(res.statusCode, 201);
    t.same(res.json().data, validClientResponse);
    t.equal(res.json().message, 'Client created successfully');
  } catch (error) {
    console.error("an error occurred: ", error)
  }
});

// test('Should return 400 if required field is missing', async (t) => {
//   const fastify = await build();
//   await fastify.ready()

//   t.teardown(() => {
//     fastify.close()
//   })

//   const { first_name, ...invalidData } = validClientData;

//   const res = await injectWithAuth(fastify, fastify.jwt.sign(authUser), invalidData)

//   t.equal(res.statusCode, 400);
//   t.same(res.json(), { status: 'validation error', message: "body must have required property 'first_name'" });
// });

// test('❌ Should return 409 if email already exists', async (t) => {
//   const fastify = await build();

//   const err = {
//     code: '23505',
//     detail: '(email)=() already exists',
//   };

//   const stub = ImportMock.mockFunction(ClientService, 'create').rejects(err);

//   t.teardown(() => {
//     stub.restore()
//     fastify.close()
//   })

//   const res = await injectWithAuth(fastify, fastify.jwt.sign(authUser), null)

//   t.equal(res.statusCode, 409);
//   t.same(res.json(), { error: 'email already exists' });
// });

// test('❌ Should return 500 on unhandled server error', async (t) => {
//   const fastify = await build();

//   const stub = ImportMock.mockFunction(ClientService, 'create').rejects(new Error('Unexpected DB error'));
  
//   t.teardown(async () => {
//     stub.restore()
//     await fastify.close()
//   })

//   const res = await injectWithAuth(fastify, fastify.jwt.sign(authUser), null)

//   t.equal(res.statusCode, 500);
//   t.match(res.body, /Unexpected DB error/);
// });
