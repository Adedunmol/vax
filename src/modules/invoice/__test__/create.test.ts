import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import InvoiceService from '../invoice.service';

const url = '/api/v1/invoices';

const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const clientId = faker.number.int();
const description = faker.lorem.sentence();
const items = [
    { units: 5, rate: 100, description: "Design work", paid: false },
    { units: 2, rate: 200, description: "Development work", paid: true }
];

const createInvoiceStub = ImportMock.mockFunction(InvoiceService, 'create', {
    id: faker.number.int(),
    due_date: new Date(dueDate),
    client_id: clientId,
    description,
    items
});

test("✅ Should create an invoice successfully", async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        createInvoiceStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: dueDate, client_id: clientId, description, items }
    });

    t.equal(response.statusCode, 201);
    t.same(response.json(), {
        message: "Invoice created successfully",
        data: { id: createInvoiceStub.returnValues[0].id, due_date: new Date(dueDate), client_id: clientId, description, items }
    });
});

test("✅ Should accept a valid string date", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: "2025-06-06", client_id: clientId, items }
    });

    t.not(response.statusCode, 400);
});

test("❌ Should return 400 if due_date is invalid", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: "invalid-date", client_id: clientId, items }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /invalid due_date format/ });
});

test("❌ Should return 400 if due_date is in the past", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: pastDueDate, client_id: clientId, items }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /due_date must be in the future/ });
});

test("❌ Should return 400 if client_id is missing", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: dueDate, items }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /client_id is required/ });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(InvoiceService, 'create', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { due_date: dueDate, client_id: clientId, items }
    });

    t.equal(response.statusCode, 500);
});
