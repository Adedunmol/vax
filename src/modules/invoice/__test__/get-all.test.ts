import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import InvoiceService from '../invoice.service';

const url = '/api/v1/invoices';

const invoicesMock = [
    { id: 1, due_date: new Date().toISOString(), client_id: 100, description: "Invoice 1", items: [] },
    { id: 2, due_date: new Date().toISOString(), client_id: 101, description: "Invoice 2", items: [] }
];

const getAllInvoicesStub = ImportMock.mockFunction(InvoiceService, 'getAll', invoicesMock);

test("✅ Should retrieve all invoices successfully", async (t) => {
    const fastify = build();
    t.teardown(() => {
        fastify.close();
        getAllInvoicesStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        message: "Invoices retrieved successfully",
        data: { invoices: invoicesMock }
    });
});

test("✅ Should return empty list when no invoices exist", async (t) => {
    const fastify = build();
    const emptyStub = ImportMock.mockFunction(InvoiceService, 'getAll', []);
    t.teardown(() => {
        fastify.close();
        emptyStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        message: "Invoices retrieved successfully",
        data: { invoices: [] }
    });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(InvoiceService, 'getAll', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "GET",
        url
    });

    t.equal(response.statusCode, 500);
});
