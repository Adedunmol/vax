import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import clientService from '../client.service';

const url = '/api/v1/clients';

const validClients = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "johndoe@example.com",
    phone_number: "123-456-7890",
    createdBy: 1,
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "janesmith@example.com",
    phone_number: "987-654-3210",
    createdBy: 1,
  },
];

const getAllClientsStub = ImportMock.mockFunction(clientService, 'getAll', validClients);

test("✅ Should retrieve all clients successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getAllClientsStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Clients retrieved successfully", data: { clients: validClients } });
});

// Test: No clients found
test("✅ Should return an empty array if no clients exist", async (t) => {
  const fastify = build();
  getAllClientsStub.restore();
  const emptyStub = ImportMock.mockFunction(clientService, 'getAll', []);

  t.teardown(() => {
    fastify.close();
    emptyStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Clients retrieved successfully", data: { clients: [] } });
});

// Test: Internal server error
test("❌ Should return error for internal server failure", async (t) => {
  const fastify = build();
  getAllClientsStub.restore();
  const errorStub = ImportMock.mockFunction(clientService, 'getAll', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
