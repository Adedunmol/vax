import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ReminderService from '../reminder.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully delete a reminder', async (t) => {
    const fastify = build()

    const reminder = {
        id: faker.number.int(),
        title: faker.lorem.words(),
        remindAt: new Date(),
        reminderStatus: 'canceled',
        deleted_at: new Date(),
        userId: userId
    }

    const stub = ImportMock.mockFunction(ReminderService, 'delete', reminder)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/reminders/${reminder.id}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Reminder deleted successfully',
        data: { ...reminder }
    })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 400 if reminderId is missing in params', async (t) => {
    const fastify = build()

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/reminders/`, // Invalid path, will be treated as 404 or route mismatch
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 400)
    t.match(res.json(), { message: 'reminderId is required' })

    await fastify.close()
})

test('❌ Should return 404 if reminder not found', async (t) => {
    const fastify = build()

    const reminderId = faker.number.int()

    const stub = ImportMock.mockFunction(ReminderService, 'delete', null)

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/reminders/${reminderId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), { message: 'No reminder found with the id' })

    stub.restore()
    await fastify.close()
})

test('❌ Should return 500 if ReminderService.delete throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(ReminderService, 'delete', () => {
        throw new Error('Database failure')
    })

    fastify.decorateRequest('user', null)
    fastify.addHook('preHandler', (req, _, done) => {
        req.user = authUser
        done()
    })

    const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/reminders/123`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 500)
    t.match(res.json(), { message: 'Database failure' })

    stub.restore()
    await fastify.close()
})
