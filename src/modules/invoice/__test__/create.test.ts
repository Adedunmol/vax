import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import InvoiceService from '../invoice.service'
import SettingsService from '../../settings/settings.service'
import { WeeklyInterval } from '../invoice.controller'
import * as ReminderService from '../../reminder/reminder.controller'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should create invoice successfully', async (t) => {
  const fastify = build()

  const settings = {
    recurrentReminders: true,
    recurrentInterval: WeeklyInterval,
    notify_before: 2
  }

  const invoice = {
    id: faker.number.int(),
    dueDate: faker.date.soon(),
    description: 'Test invoice',
    createdBy: userId,
    createdFor: 1
  }

  const body = {
    due_date: invoice.dueDate.toISOString(),
    client_id: 1,
    description: 'Test invoice',
    items: [
      { units: 2, rate: 50 }
    ]
  }

  const settingsStub = ImportMock.mockFunction(SettingsService, 'get', settings)
  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'create', invoice)
  const reminderStub = ImportMock.mockFunction(ReminderService, 'createReminder', Promise.resolve())

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 201)
  t.match(res.json(), {
    message: 'Invoice created successfully',
    data: invoice
  })

  settingsStub.restore()
  invoiceStub.restore()
  reminderStub.restore()
  await fastify.close()
})

test('❌ Should return 400 if no user settings found', async (t) => {
  const fastify = build()

  const settingsStub = ImportMock.mockFunction(SettingsService, 'get', null)

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const body = {
    due_date: faker.date.soon().toISOString(),
    client_id: 1,
    items: []
  }

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: 'No settings associated with user' })

  settingsStub.restore()
  await fastify.close()
})

test('❌ Should return 500 if InvoiceService.create throws error', async (t) => {
  const fastify = build()

  const settingsStub = ImportMock.mockFunction(SettingsService, 'get', {
    recurrentReminders: true,
    recurrentInterval: WeeklyInterval,
    notify_before: 1
  })

  const invoiceStub = ImportMock.mockFunction(InvoiceService, 'create', Promise.reject(new Error('DB Error')))

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const body = {
    due_date: faker.date.soon().toISOString(),
    client_id: 1
  }

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: /DB Error/ })

  settingsStub.restore()
  invoiceStub.restore()
  await fastify.close()
})

test('❌ Should return 400 for invalid due_date format', async (t) => {
  const fastify = build()

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const body = {
    due_date: 'not-a-date',
    client_id: 1
  }

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: /invalid due_date format/ })

  await fastify.close()
})

test('❌ Should return 400 for due_date in the past', async (t) => {
  const fastify = build()

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const body = {
    due_date: yesterday.toISOString(),
    client_id: 1
  }

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: /due_date must be in the future/ })

  await fastify.close()
})

test('❌ Should return 400 for missing client_id', async (t) => {
  const fastify = build()

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const body = {
    due_date: faker.date.soon().toISOString()
  }

  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/invoices',
    payload: body,
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 400)
  t.match(res.json(), { message: /client_id is required/ })

  await fastify.close()
})
