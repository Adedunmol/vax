import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import clientService from '../client.service';

const url = '/api/v1/clients/create';

const validClient = {
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  phone_number: faker.phone.number(),
};

const createClientStub = ImportMock.mockFunction(clientService, 'create', {
  id: faker.number.int(),
  ...validClient,
  createdBy: faker.number.int(),
});

test("✅ Should create a client successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    createClientStub.restore();
  });

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: validClient,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 201);
  t.same(response.json(), { message: "Client created successfully", data: createClientStub.returnValue });
});

// Test: Missing first_name
test("❌ Should return error for missing first_name", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { ...validClient, first_name: undefined },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /first_name is required/);
});

// Test: Missing last_name
test("❌ Should return error for missing last_name", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { ...validClient, last_name: undefined },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /last_name is required/);
});

// Test: Invalid email format
test("❌ Should return error for invalid email format", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { ...validClient, email: "invalid-email" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Should be a valid email/);
});

// Test: Missing phone_number
test("❌ Should return error for missing phone_number", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { ...validClient, phone_number: undefined },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /phone_number is required/);
});

// Test: No payload
test("❌ Should return error if no payload is provided", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Invalid request payload/);
});
