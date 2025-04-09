import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import InvoiceService from '../invoice.service'

const userId = faker.number.int()
const invoiceId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should update invoice successfully', async (t) => {
  const fastify = build()

  const updatedInvoice = {
    id: invoiceId,
    description: 'Updated Invoice Description',
    amount: 200.00,
    expense_date: new Date(),
    createdBy: userId,
    createdFor: 1
  }

  const stub = ImportMock.mockFunction(InvoiceService, 'update', updatedInvoice)

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' },
    payload: { description: 'Updated Invoice Description', amount: 200.00 }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Invoice updated successfully',
    data: updatedInvoice
  })

  stub.restore()
  await fastify.close()
})

test('❌ Should return 400 if invoiceId is missing', async (t) => {
  const fastify = build()

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/`,
    headers: { Authorization: 'Bearer mock-token' },
    payload: { description: 'Updated Invoice Description', amount: 200.00 }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'invoiceId is required' })

  await fastify.close()
})

test('❌ Should return 400 if expense_date is invalid (not a date)', async (t) => {
  const fastify = build()

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' },
    payload: { description: 'Updated Invoice Description', amount: 200.00, expense_date: 'invalid-date' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'invalid due_date format' })

  await fastify.close()
})

test('❌ Should return 400 if expense_date is in the past', async (t) => {
  const fastify = build()

  const pastDate = new Date(new Date().setDate(new Date().getDate() - 1)) // Yesterday

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' },
    payload: { description: 'Updated Invoice Description', amount: 200.00, expense_date: pastDate.toISOString() }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'due_date must be in the future' })

  await fastify.close()
})

test('❌ Should return 500 if InvoiceService.update throws an error', async (t) => {
  const fastify = build()

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'update', Promise.reject(new Error('DB Error')))

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' },
    payload: { description: 'Updated Invoice Description', amount: 200.00 }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: /DB Error/ })

  invoiceStub.restore()
  await fastify.close()
})
