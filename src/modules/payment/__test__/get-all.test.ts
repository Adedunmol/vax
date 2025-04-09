import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import PaymentService from '../payment.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should retrieve all payments successfully', async (t) => {
    const fastify = build()

    const payments = [
        {
            id: faker.number.int(),
            amount: faker.number.float(),
            paymentDate: new Date(),
            paymentMethod: 'bank_transfer',
            invoiceId: faker.number.int()
        },
        {
            id: faker.number.int(),
            amount: faker.number.float(),
            paymentDate: new Date(),
            paymentMethod: 'cash',
            invoiceId: faker.number.int()
        }
    ]

    const stub = ImportMock.mockFunction(PaymentService, 'getAll', payments)

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

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payments retrieved successfully',
        data: { expenses: payments }
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 500 if PaymentService.getAll throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'getAll', () => {
        throw new Error('Something went wrong')
    })

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

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Something went wrong' })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 200 with an empty array when no payments are found', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'getAll', [])

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

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Payments retrieved successfully',
        data: { expenses: [] }
    })

    stub.restore()
    await fastify.close()
})
