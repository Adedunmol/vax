import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import InvoiceService from '../invoice.service';

const url = '/api/v1/invoices';
const invoiceId = faker.number.int();

test("✅ Should delete an invoice successfully", async (t) => {
    const fastify = build();
    const deleteInvoiceStub = ImportMock.mockFunction(InvoiceService, 'delete', { id: invoiceId });
    
    t.teardown(() => {
        fastify.close();
        deleteInvoiceStub.restore();
    });

    const response = await fastify.inject({
        method: "DELETE",
        url: `${url}/${invoiceId}`
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), { message: "Invoice deleted successfully", data: { id: invoiceId } });
});

test("❌ Should return 400 if invoiceId is missing for deletion", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "DELETE",
        url: `${url}/`
    });

    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /invoiceId is required/ });
});

test("❌ Should return 500 if an internal error occurs during deletion", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(InvoiceService, 'delete', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "DELETE",
        url: `${url}/${invoiceId}`
    });

    t.equal(response.statusCode, 500);
});
