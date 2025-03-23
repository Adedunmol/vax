import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';

// Ensure test mode
process.env.NODE_ENV = 'test';
const url = '/api/v1/register'

test("registration", async (t) => {
    const fastify = build()

    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.username()
    const email = faker.internet.email()
    const password = faker.internet.password()
    const passwordConfirmation = password
    const id = Math.floor(Math.random() * 1000)

    const stub = ImportMock.mockFunction(userService, 'createUser', {
      firstName,
      lastName,
      email,
      username,
      id
    })
    
    t.afterEach(() => {
      fastify.close()
      stub.restore()
  })

    await t.test("✅ Should register a user successfully", async () => {
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
      t.same(response.json(), { message: "User registered successfully" });
    });

    await t.test("❌ Should return error when required fields are missing", async () => {
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
      t.same(response.json(), /Invalid request/);
    });

    await t.test("❌ Should return error for invalid email format", async () => {
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
      t.same(response.json(), /Invalid request/);
    });

    await t.test("❌ Should return error for weak password", async () => {
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
      t.same(response.json(), /Invalid request/);
    });

    await t.test("❌ Should return error when registering with an existing email", async () => {
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
      t.same(response.json(), { error: "Email already registered" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      // Mocking a crash by overriding the function
      fastify.post("/api/v1/register", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url,
        payload: {
          email: "crash@example.com",
          password: "StrongPass123",
          name: "Server Error",
        },
      });

      t.equal(response.statusCode, 500);
    });
});