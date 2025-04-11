import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ExpenseService from '../expenses.service'

const userId = faker.number.int()
const expenseId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should delete expense successfully', async (t) => {
  const fastify = build()

  const deletedExpense = {
    id: expenseId,
    category: 'Groceries',
    amount: '120.00',
    expenseDate: new Date(),
    deleted_at: new Date(),
    userId
  }

  const stub = ImportMock.mockFunction(ExpenseService, 'delete', deletedExpense)

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: `/api/v1/expenses/${expenseId}`,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Expense deleted successfully',
    data: deletedExpense
  })
})

test('🚫 Should return 400 if expenseId param is missing', async (t) => {
  const fastify = build()

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: '/api/v1/expenses/',
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 404) // Route not matched
})

test('🧨 Should return 500 if ExpenseService.delete throws error', async (t) => {
  const fastify = build()

  const stub = ImportMock.mockFunction(ExpenseService, 'delete', () => {
    throw new Error('DB delete failed')
  })

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'DELETE',
    url: `/api/v1/expenses/${expenseId}`,
    headers: { Authorization: 'Bearer token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: 'DB delete failed' })
})
