import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import paymentService from '../payment.service';

const url = '/api/v1/payments';
const paymentId = Math.floor(Math.random() * 1000);
const userId = Math.floor(Math.random() * 1000);

const amount = faker.number.float({ min: 1, max: 1000 }); // , precision: 0.01
const payment_method = faker.helpers.arrayElement(['bank_transfer', 'cash', 'online_payment', 'crypto']);
const payment_date = faker.date.past().toISOString();
const invoice_id = Math.floor(Math.random() * 1000);

const updatePaymentStub = ImportMock.mockFunction(paymentService, 'update', {});

test('✅ Should update a payment successfully', async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        updatePaymentStub.restore();
    });

    const response = await fastify.inject({
        method: 'PUT',
        url: `${url}/${paymentId}`,
        payload: { amount, payment_method, payment_date, invoice_id },
        headers: { authorization: `Bearer token`, user: JSON.stringify({ id: userId }) },
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), { message: 'Payment updated successfully', data: {} });
});

test('❌ Should return 400 if paymentId is missing', async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
    });

    const response = await fastify.inject({
        method: 'PUT',
        url: `${url}/`,
        payload: { amount, payment_method, payment_date, invoice_id },
        headers: { authorization: `Bearer token`, user: JSON.stringify({ id: userId }) },
    });

    t.equal(response.statusCode, 400);
    t.same(response.json(), { message: 'paymentId is required' });
});

test('❌ Should return 500 if service throws an error', async (t) => {
    const fastify = build();
    updatePaymentStub.throws(new Error('Internal Server Error'));

    t.teardown(() => {
        fastify.close();
        updatePaymentStub.restore();
    });

    const response = await fastify.inject({
        method: 'PUT',
        url: `${url}/${paymentId}`,
        payload: { amount, payment_method, payment_date, invoice_id },
        headers: { authorization: `Bearer token`, user: JSON.stringify({ id: userId }) },
    });

    t.equal(response.statusCode, 500);
});
