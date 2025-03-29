import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import clientService from '../client.service';

const url = '/api/v1/clients';
const clientId = 123;

const updatedClientData = {
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  phone_number: faker.phone.number(),
};

const updatedClientResponse = {
  id: clientId,
  ...updatedClientData,
  createdBy: 1,
};

const updateClientStub = ImportMock.mockFunction(clientService, 'update', updatedClientResponse);

test("✅ Should update client successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    updateClientStub.restore();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url: `${url}/${clientId}`,
    payload: updatedClientData,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Client updated successfully", data: updatedClientResponse });
});

// Test: Missing clientId
test("❌ Should return error for missing clientId", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "PATCH",
    url: `${url}/`,
    payload: updatedClientData,
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /clientId is required/);
});

// Test: Invalid email format
test("❌ Should return error for invalid email format", async (t) => {
  const fastify = build();

  t.teardown(() => fastify.close());

  const invalidData = { ...updatedClientData, email: "invalid-email" };

  const response = await fastify.inject({
    method: "PATCH",
    url: `${url}/${clientId}`,
    payload: invalidData,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Should be a valid email/);
});

// Test: Internal server error
test("❌ Should return error for internal server error", async (t) => {
  const fastify = build();
  updateClientStub.restore();
  const errorStub = ImportMock.mockFunction(clientService, 'update', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url: `${url}/${clientId}`,
    payload: updatedClientData,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
