import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ExpenseService from '../expenses.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should get all expenses successfully', async (t) => {
  const fastify = build()

  const mockExpenses = [
    {
      id: faker.number.int(),
      category: 'Groceries',
      amount: '45.99',
      expenseDate: new Date(),
      userId
    },
    {
      id: faker.number.int(),
      category: 'Transport',
      amount: '10.50',
      expenseDate: new Date(),
      userId
    }
  ]

  const stub = ImportMock.mockFunction(ExpenseService, 'getAll', mockExpenses)

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/expenses',
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Expenses retrieved successfully',
    data: {
      expenses: mockExpenses
    }
  })

  stub.restore()
  await fastify.close()
})

test('✅ Should return empty array if user has no expenses', async (t) => {
  const fastify = build()

  const stub = ImportMock.mockFunction(ExpenseService, 'getAll', [])

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/expenses',
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  })

  t.equal(res.statusCode, 200)
  t.same(res.json().data.expenses, [])
  t.match(res.json(), { message: 'Expenses retrieved successfully' })

  stub.restore()
  await fastify.close()
})

test('🧨 Should handle internal server error', async (t) => {
  const fastify = build()

  const stub = ImportMock.mockFunction(ExpenseService, 'getAll', () => {
    throw new Error('Database failure')
  })

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _res, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/expenses',
    headers: {
      Authorization: 'Bearer mocked-token'
    }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: 'Database failure' })

  stub.restore()
  await fastify.close()
})
