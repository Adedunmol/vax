import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ReminderService from '../reminder.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully fetch all reminders for a user', async (t) => {
    const fastify = build()

    const reminders = Array.from({ length: 3 }, () => ({
        id: faker.number.int(),
        invoiceId: faker.number.int(),
        intervalDays: faker.number.int({ min: 1, max: 10 }),
        dueDate: faker.date.future(),
        reminderStatus: 'scheduled',
        userId
    }))

    const stub = ImportMock.mockFunction(ReminderService, 'getAll', reminders)

    t.teardown(async () => {
        stub.restore()
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
        method: 'GET',
        url: '/api/v1/reminders',
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Reminders retrieved successfully',
        data: {
            reminders
        }
    })
})

test('✅ Should return empty list if user has no reminders', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(ReminderService, 'getAll', [])

    t.teardown(async () => {
        stub.restore()
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
        method: 'GET',
        url: '/api/v1/reminders',
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Reminders retrieved successfully',
        data: {
            reminders: []
        }
    })
})

test('❌ Should return 500 if service throws an error', async (t) => {
    const fastify = build()

    const stub = ImportMock.mockFunction(ReminderService, 'getAll', Promise.reject(new Error('DB Failure')))

    t.teardown(async () => {
        stub.restore()
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
        method: 'GET',
        url: '/api/v1/reminders',
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 500)
})
