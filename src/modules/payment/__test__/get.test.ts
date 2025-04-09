import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import PaymentService from '../payment.service'

const userId = faker.number.int()
const paymentId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should retrieve payment successfully', async (t) => {
    const fastify = build()

    const payment = {
        id: paymentId,
        amount: faker.number.float(),
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        invoiceId: faker.number.int()
    }

    const stub = ImportMock.mockFunction(PaymentService, 'get', payment)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/payments/${paymentId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payment retrieved successfully',
        data: payment
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 400 if paymentId is not provided', async (t) => {
    const fastify = build()

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/payments/`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), {
        message: 'paymentId is required'
    })

    await fastify.close()
})

test('❌ Should return 404 if no payment is found with the given paymentId', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'get', null)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/payments/${paymentId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), {
        message: 'No payment found with the id'
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 500 if PaymentService.get throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'get', () => {
        throw new Error('Something went wrong')
    })

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/payments/${paymentId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Something went wrong' })

    stub.restore()
    await fastify.close()
})
