import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import InvoiceService from '../invoice.service';

const url = '/api/v1/invoices';
const invoiceId = faker.number.int();
const userId = faker.number.int();
const invoiceData = {
    id: invoiceId,
    due_date: new Date().toISOString(),
    client_id: faker.number.int(),
    description: faker.lorem.sentence(),
    items: [
        { units: 5, rate: 100, description: "Design work", paid: false },
        { units: 2, rate: 200, description: "Development work", paid: true }
    ]
};

const getInvoiceStub = ImportMock.mockFunction(InvoiceService, 'get', invoiceData);

test("✅ Should retrieve an invoice successfully", async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        getInvoiceStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/${invoiceId}`
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        message: "Invoice retrieved successfully",
        data: invoiceData
    });
});

test("❌ Should return 400 if invoiceId is missing", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/`
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /invoiceId is required/ });
});

test("❌ Should return 404 if invoice does not exist", async (t) => {
    const fastify = build();
    const notFoundStub = ImportMock.mockFunction(InvoiceService, 'get', null);
    
    t.teardown(() => {
        fastify.close();
        notFoundStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/${invoiceId}`
    });

    t.equal(response.statusCode, 404);
    t.match(response.json(), { message: /No invoice found with the id/ });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(InvoiceService, 'get', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url: `${url}/${invoiceId}`
    });

    t.equal(response.statusCode, 500);
});
