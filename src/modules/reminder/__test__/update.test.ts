import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ReminderService from '../reminder.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully update a reminder', async (t) => {
    const fastify = build()

    const reminderId = faker.number.int()
    const updatedReminder = {
        id: reminderId,
        invoiceId: faker.number.int(),
        intervalDays: 5,
        cancel: true,
        dueDate: new Date(Date.now() + 86400000), // 1 day in future
        userId
    }

    const stub = ImportMock.mockFunction(ReminderService, 'update', updatedReminder)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/reminders/${reminderId}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoiceId: updatedReminder.invoiceId,
            intervalDays: updatedReminder.intervalDays,
            cancel: updatedReminder.cancel,
            dueDate: updatedReminder.dueDate.toISOString()
        }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Reminder updated successfully',
        data: { ...updatedReminder }
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 400 when dueDate is in the past', async (t) => {
    const fastify = build()
    const reminderId = faker.number.int()

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/reminders/${reminderId}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoiceId: faker.number.int(),
            dueDate: new Date(Date.now() - 86400000).toISOString() // 1 day in past
        }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json().message, /due_date must be in the future/)

    await fastify.close()
})

test('❌ Should return 500 if service throws error', async (t) => {
    const fastify = build()
    const reminderId = faker.number.int()

    const stub = ImportMock.mockFunction(ReminderService, 'update', Promise.reject(new Error('DB error')))

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/reminders/${reminderId}`,
        headers: { Authorization: 'Bearer mock-token' },
        payload: {
            invoiceId: faker.number.int(),
            dueDate: new Date(Date.now() + 86400000).toISOString()
        }
    })

    t.equal(res.statusCode, 500)

    stub.restore()
    await fastify.close()
})
