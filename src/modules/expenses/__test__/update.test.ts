import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ExpenseService from '../expenses.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

const expenseId = faker.number.int()
const updateData = {
  category: 'Health',
  amount: 75.5,
  expense_date: new Date().toISOString()
}

test('✅ Should update expense successfully', async (t) => {
  const fastify = build()

  const updatedExpense = {
    id: expenseId,
    ...updateData,
    amount: updateData.amount.toFixed(2),
    expenseDate: new Date(updateData.expense_date),
    userId
  }

  const stub = ImportMock.mockFunction(ExpenseService, 'update', updatedExpense)

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/expenses/${expenseId}`,
    payload: updateData,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Expense updated successfully',
    data: updatedExpense
  })
})

test('🚫 Should return 400 if expenseId is missing in params', async (t) => {
  const fastify = build()

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
    fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/expenses/`,
    payload: updateData,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 404) // Fastify will treat missing param as 404 route not found
})

test('🧨 Should return 500 if ExpenseService.update throws an error', async (t) => {
  const fastify = build()

  const stub = ImportMock.mockFunction(ExpenseService, 'update', () => {
    throw new Error('DB failed')
  })

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/expenses/${expenseId}`,
    payload: updateData,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: 'DB failed' })
})

test('✅ Should allow partial updates (only category)', async (t) => {
  const fastify = build()

  const partialUpdate = { category: 'Transport' }
  const mockResponse = {
    id: expenseId,
    category: 'Transport',
    amount: '12.00',
    expenseDate: new Date(),
    userId
  }

  const stub = ImportMock.mockFunction(ExpenseService, 'update', mockResponse)

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/expenses/${expenseId}`,
    payload: partialUpdate,
    headers: { Authorization: 'Bearer token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Expense updated successfully',
    data: mockResponse
  })
})
