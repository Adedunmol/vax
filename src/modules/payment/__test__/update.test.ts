import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import PaymentService from '../payment.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully update a payment', async (t) => {
    const fastify = build()

    const payment = {
        id: faker.number.int(),
        amount: faker.number.float(),
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        invoiceId: faker.number.int()
    }

    const updateData = {
        payment_method: 'online_payment',
        payment_date: new Date()
    }

    const stub = ImportMock.mockFunction(PaymentService, 'update', {
        ...payment,
        ...updateData
    })

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/payments/${payment.id}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: updateData
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payment updated successfully',
        data: { ...payment, ...updateData }
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
        method: 'PATCH',
        url: `/api/v1/payments/`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: { payment_method: 'online_payment' }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), { message: 'paymentId is required' })

    await fastify.close()
})

test('❌ Should return 400 if update payload is invalid (invalid payment_date format)', async (t) => {
    const fastify = build()

    const payment = {
        id: faker.number.int(),
        amount: faker.number.float(),
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        invoiceId: faker.number.int()
    }

    const updateData = {
        payment_method: 'online_payment',
        payment_date: 'invalid-date-format'
    }

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/payments/${payment.id}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: updateData
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), { message: 'Invalid payment_date format' })

    await fastify.close()
})

test('❌ Should return 500 if PaymentService.update throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'update', () => {
        throw new Error('Something went wrong')
    })

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/payments/123`, // Simulate a valid payment ID
        headers: { Authorization: 'Bearer mock-token' },
        payload: { payment_method: 'online_payment' }
    })

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Something went wrong' })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 404 if the payment does not exist for the user', async (t) => {
    const fastify = build()

    const paymentId = faker.number.int()

    const stub = ImportMock.mockFunction(PaymentService, 'update', () => null)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/payments/${paymentId}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: { payment_method: 'online_payment' }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), { message: 'Payment not found' })

    stub.restore()
    await fastify.close()
})
