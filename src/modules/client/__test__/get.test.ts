import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import clientService from '../client.service';

const url = '/api/v1/clients';
const clientId = 123;

const validClient = {
  id: clientId,
  first_name: "John",
  last_name: "Doe",
  email: "johndoe@example.com",
  phone_number: "123-456-7890",
  createdBy: 1,
};

const getClientStub = ImportMock.mockFunction(clientService, 'get', validClient);

test("✅ Should retrieve a client successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getClientStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${clientId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Client retrieved successfully", data: validClient });
});

// Test: Missing clientId
test("❌ Should return error for missing clientId", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/`,
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /clientId is required/);
});

// Test: Client not found
test("❌ Should return error for non-existent client", async (t) => {
  const fastify = build();
  getClientStub.restore();
  const notFoundStub = ImportMock.mockFunction(clientService, 'get', null);

  t.teardown(() => {
    fastify.close();
    notFoundStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${clientId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 404);
  t.match(response.json().message, /No client found with the id/);
});

// Test: Internal server error
test("❌ Should return error for internal server error", async (t) => {
  const fastify = build();
  getClientStub.restore();
  const errorStub = ImportMock.mockFunction(clientService, 'get', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${clientId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
