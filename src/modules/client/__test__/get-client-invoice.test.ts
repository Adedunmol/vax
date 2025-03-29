import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import ClientService from '../client.service';

const url = '/api/v1/clients';
const clientId = faker.number.int();
const invoices = [
    { id: faker.number.int(), amount: faker.number.float({ min: 10, max: 1000 }), due_date: faker.date.future().toISOString() },
    { id: faker.number.int(), amount: faker.number.float({ min: 10, max: 1000 }), due_date: faker.date.future().toISOString() }
];

const getInvoicesStub = ImportMock.mockFunction(ClientService, 'getInvoices', invoices);

test("✅ Should retrieve all invoices for a client successfully", async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        getInvoicesStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/${clientId}/invoices`
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        message: "Invoices retrieved successfully",
        data: { invoices }
    });
});

test("❌ Should return 400 if clientId is missing", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/invoices`
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /clientId is required/ });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(ClientService, 'getInvoices', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/${clientId}/invoices`
    });

    t.equal(response.statusCode, 500);
});
