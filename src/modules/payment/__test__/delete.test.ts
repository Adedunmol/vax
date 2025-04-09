import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import PaymentService from '../payment.service'
import db from '../../../db'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully delete a payment', async (t) => {
    const fastify = build()

    const payment = {
        id: faker.number.int(),
        amount: faker.number.float(),
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        invoiceId: faker.number.int(),
        userId: userId
    }

    const stub = ImportMock.mockFunction(PaymentService, 'delete', payment)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/payments/${payment.id}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payment deleted successfully',
        data: { ...payment }
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 400 if paymentId is missing in params', async (t) => {
    const fastify = build()

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/payments/`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), { message: 'paymentId is required' })

    await fastify.close()
})

test('❌ Should return 500 if PaymentService.delete throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'delete', () => {
        throw new Error('Something went wrong')
    })

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/payments/123`, // Simulate a valid payment ID
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Something went wrong' })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 404 if payment not found for the user', async (t) => {
    const fastify = build()

    const paymentId = faker.number.int()

    const stub = ImportMock.mockFunction(PaymentService, 'delete', () => null)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/payments/${paymentId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), { message: 'No payment found with the id' })

    stub.restore()
    await fastify.close()
})

test('✅ Should update invoice amount when payment is deleted', async (t) => {
    const fastify = build()

    const payment = {
        id: faker.number.int(),
        amount: faker.number.float(),
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        invoiceId: faker.number.int(),
        userId: userId
    }

    const updatedInvoice = {
        id: payment.invoiceId,
        amountPaid: faker.number.float() - payment.amount,
        status: 'partially_paid'
    }

    const paymentServiceStub = ImportMock.mockFunction(PaymentService, 'delete', payment)
    const dbUpdateStub = ImportMock.mockFunction(db, 'update', updatedInvoice)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/payments/${payment.id}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payment deleted successfully',
        data: { ...payment }
    })

    dbUpdateStub.restore()
    paymentServiceStub.restore()
    await fastify.close()
})
