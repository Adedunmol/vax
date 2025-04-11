import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import InvoiceService from '../invoice.service'

const userId = faker.number.int()
const invoiceId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should retrieve invoice successfully', async (t) => {
  const fastify = build()

  const invoice = {
    id: invoiceId,
    dueDate: faker.date.soon(),
    description: 'Test invoice',
    createdBy: userId,
    createdFor: 1
  }

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'get', invoice)

  t.teardown(async () => {
    invoiceStub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Invoice retrieved successfully',
    data: invoice
  })
})

test('❌ Should return 400 if invoiceId is not provided', async (t) => {
  const fastify = build()

  t.teardown(async () => {
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/invoices/',
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'invoiceId is required' })
})

test('❌ Should return 404 if no invoice found with the id', async (t) => {
  const fastify = build()

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'get', null)

  t.teardown(async () => {
    invoiceStub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 404)
  t.match(res.json(), { message: 'No invoice found with the id' })
})

test('❌ Should return 500 if InvoiceService.get throws error', async (t) => {
  const fastify = build()

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'get', Promise.reject(new Error('DB Error')))

  t.teardown(async () => {
    invoiceStub.restore()
    await fastify.close()
  })

  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user', null)
  }

  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: /DB Error/ })
})
