import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';
import * as queue from '../../../queues';

const url = '/api/v1/users/register'

const firstName = faker.person.firstName()
const lastName = faker.person.lastName()
const username = faker.internet.username()
const email = faker.internet.email()
const password = faker.internet.password()
const passwordConfirmation = password
const id = Math.floor(Math.random() * 1000)

const createUserStub = ImportMock.mockFunction(userService, 'createUser', {
  firstName,
  lastName,
  email,
  username,
  id
})

const sendToQueueStub = ImportMock.mockFunction(queue, 'sendToQueue', {})


test("✅ Should register a user successfully", async (t) => {
      const fastify = build()

      t.teardown(() => {
        fastify.close()
        createUserStub.restore()
        sendToQueueStub.restore()
      })

      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email,
          password,
          passwordConfirmation,
          firstName,
          lastName
        },
      });

      t.equal(response.statusCode, 201);
      t.same(response.json(), { message: "User registered successfully", data: { 
        firstName,
        lastName,
        email,
        username,
        id
       }});
});

test("❌ Should return error when required fields are missing", async (t) => {
      const fastify = build()
      
      t.teardown(() => {
        fastify.close()
        createUserStub.restore()
        sendToQueueStub.restore()
      })

      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email,
          password,
          firstName,
          lastName
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { message: '' });
});

test("❌ Should return error for invalid email format", async (t) => {
      const fastify = build()

      t.teardown(() => {
        fastify.close()
        createUserStub.restore()
        sendToQueueStub.restore()
      })

      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email: "invalid-email",
          password,
          passwordConfirmation,
          firstName,
          lastName
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { message: '' });
});

test("❌ Should return error for weak password", async (t) => {
      const fastify = build()

      t.teardown(() => {
        fastify.close()
        createUserStub.restore()
        sendToQueueStub.restore()
      })

      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email,
          password: "123",
          passwordConfirmation: "123",
          firstName,
          lastName
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { message: '' });
    });

test("❌ Should return error when registering with an existing email", async (t) => {
      const fastify = build()
      
      t.teardown(() => {
        fastify.close()
        createUserStub.restore()
        sendToQueueStub.restore()
      })

      // First registration
      await fastify.inject({
        method: "POST",
        url,
        payload: {
          email,
          password,
          passwordConfirmation,
          firstName,
          lastName
        },
      });

      // Second registration with same email
      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email,
          password,
          passwordConfirmation,
          firstName,
          lastName
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { message: "Email already registered" });
});