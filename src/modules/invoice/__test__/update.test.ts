import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import InvoiceService from '../invoice.service';

const url = '/api/v1/invoices';
const invoiceId = faker.number.int();
const description = faker.lorem.sentence();
const amount = faker.number.float({ min: 10, max: 1000 });
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const updateInvoiceStub = ImportMock.mockFunction(InvoiceService, 'update', {
    id: invoiceId,
    description,
    amount,
    expense_date: new Date(futureDate)
});

test("✅ Should update an invoice successfully", async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        updateInvoiceStub.restore();
    });

    const response = await fastify.inject({
        method: "PUT",
        url: `${url}/${invoiceId}`,
        payload: { description, amount, expense_date: futureDate }
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        message: "Invoice updated successfully",
        data: { id: invoiceId, description, amount, expense_date: new Date(futureDate) }
    });
});

test("❌ Should return 400 if invoiceId is missing", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "PUT",
        url: `${url}/`,
        payload: { description, amount, expense_date: futureDate }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /invoiceId is required/ });
});

test("❌ Should return 400 if due_date is invalid", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "PUT",
        url: `${url}/${invoiceId}`,
        payload: { description, amount, expense_date: "invalid-date" }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /invalid due_date format/ });
});

test("❌ Should return 400 if due_date is in the past", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "PUT",
        url: `${url}/${invoiceId}`,
        payload: { description, amount, expense_date: pastDate }
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /due_date must be in the future/ });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(InvoiceService, 'update', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "PUT",
        url: `${url}/${invoiceId}`,
        payload: { description, amount, expense_date: futureDate }
    });

    t.equal(response.statusCode, 500);
});
