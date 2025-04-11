import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import PaymentService from '../payment.service'

const userId = faker.number.int()
const invoiceId = faker.number.int()
const paymentMethod = 'bank_transfer'
const paymentDate = new Date().toISOString()
const amount = 100
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should create a payment successfully', async (t) => {
    const fastify = build()

    const payment = {
        id: faker.number.int(),
        amount: amount.toFixed(2),
        paymentDate: new Date(),
        paymentMethod,
        invoiceId
    }

    const stub = ImportMock.mockFunction(PaymentService, 'create', payment)

    t.teardown(async () => {
        stub.restore()
        await fastify.close()
      })
    
    //   if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
      fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount,
            payment_method: paymentMethod,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 201)
    t.match(res.json(), {
        message: 'Payment created successfully',
        data: payment
    })
})

test('❌ Should return 400 if invoice_id is not provided', async (t) => {
    const fastify = build()

    t.teardown(async () => {
        await fastify.close()
      })
    
    //   if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
      fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            amount,
            payment_method: paymentMethod,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), {
        message: 'invoice_id is required'
    })
})

test('❌ Should return 400 if amount is less than or equal to 0', async (t) => {
    const fastify = build()

    t.teardown(async () => {
        await fastify.close()
      })
    
    //   if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
      fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount: -1, // invalid amount
            payment_method: paymentMethod,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), {
        message: 'amount must be greater than 0'
    })
})

test('❌ Should return 400 if payment_method is missing', async (t) => {
    const fastify = build()

    t.teardown(async () => {
        await fastify.close()
      })
    
    // if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    // }
      
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), {
        message: 'payment_method of payment is required'
    })
})

test('❌ Should return 400 if payment_date is in invalid format', async (t) => {
    const fastify = build()

    t.teardown(async () => {
        await fastify.close()
      })
    
    // if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount,
            payment_method: paymentMethod,
            payment_date: 'invalid-date'
        }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), {
        message: 'Invalid payment_date format'
    })
})

test('❌ Should return 404 if invoice does not exist', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'create', null)

    t.teardown(async () => {
        stub.restore()
        await fastify.close()
      })
    
    // if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount,
            payment_method: paymentMethod,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), {
        message: 'Invoice not found'
    })
})

test('❌ Should return 500 if PaymentService.create throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(PaymentService, 'create', () => {
        throw new Error('Something went wrong')
    })

    t.teardown(async () => {
        stub.restore()
        await fastify.close()
      })
    
    //   if (!fastify.hasRequestDecorator('user')) {
    //     fastify.decorateRequest('user', null)
    //   }
      
      fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/payments',
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoice_id: invoiceId,
            amount,
            payment_method: paymentMethod,
            payment_date: paymentDate
        }
    })

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Something went wrong' })
})
