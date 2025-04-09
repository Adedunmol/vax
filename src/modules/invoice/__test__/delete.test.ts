import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import InvoiceService from '../invoice.service'

const userId = faker.number.int()
const invoiceId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should delete invoice successfully', async (t) => {
  const fastify = build()

  const deletedInvoice = {
    id: invoiceId,
    description: 'Invoice Description',
    amount: 100.00,
    expense_date: new Date(),
    createdBy: userId,
    createdFor: 1,
    deleted_at: new Date() // Mocking deleted date
  }

  const stub = ImportMock.mockFunction(InvoiceService, 'delete', deletedInvoice)

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Invoice deleted successfully',
    data: deletedInvoice
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
    method: 'DELETE',
    url: `/api/v1/invoices/`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'invoiceId is required' })

  await fastify.close()
})

test('❌ Should return 404 if invoice is not found', async (t) => {
  const fastify = build()

  const stub = ImportMock.mockFunction(InvoiceService, 'delete', null) // Simulating invoice not found

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 404)
  t.match(res.json(), { message: 'No invoice found with the id' })

  stub.restore()
  await fastify.close()
})

test('❌ Should return 500 if InvoiceService.delete throws an error', async (t) => {
  const fastify = build()

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'delete', Promise.reject(new Error('DB Error')))

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: `/api/v1/invoices/${invoiceId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: /DB Error/ })

  invoiceStub.restore()
  await fastify.close()
})
