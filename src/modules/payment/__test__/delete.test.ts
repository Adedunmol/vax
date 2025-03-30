import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import PaymentService from '../payment.service';

const url = '/api/v1/payments';
const paymentId = 123;
const userId = 456;

const deletePaymentStub = ImportMock.mockFunction(PaymentService, 'delete', { id: paymentId, userId });

test('✅ Should delete a payment successfully', async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        deletePaymentStub.restore();
    });

    const response = await fastify.inject({
        method: 'DELETE',
        url: `${url}/${paymentId}`,
        headers: { Authorization: `Bearer mock_token` },
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), { message: 'Payment deleted successfully', data: { id: paymentId, userId } });
});

test('❌ Should return 400 if paymentId is missing', async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
    });

    const response = await fastify.inject({
        method: 'DELETE',
        url: `${url}/`,
        headers: { Authorization: `Bearer mock_token` },
    });

    t.equal(response.statusCode, 400);
    t.same(response.json(), { message: 'paymentId is required' });
});

test('❌ Should return 500 on unexpected error', async (t) => {
    const fastify = build();
    deletePaymentStub.throws(new Error('Unexpected error'));

    t.teardown(() => {
        fastify.close();
        deletePaymentStub.restore();
    });

    const response = await fastify.inject({
        method: 'DELETE',
        url: `${url}/${paymentId}`,
        headers: { Authorization: `Bearer mock_token` },
    });

    t.equal(response.statusCode, 500);
});
