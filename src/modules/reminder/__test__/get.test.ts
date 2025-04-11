import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ReminderService from '../reminder.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should successfully get a reminder by ID', async (t) => {
    const fastify = build()

    const reminder = {
        id: faker.number.int(),
        invoiceId: faker.number.int(),
        intervalDays: faker.number.int({ min: 1, max: 10 }),
        dueDate: faker.date.future(),
        reminderStatus: 'active',
        userId
    }

    const stub = ImportMock.mockFunction(ReminderService, 'get', reminder)

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
        url: `/api/v1/reminders/${reminder.id}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 200)
    t.match(res.json(), {
        message: 'Reminder retrieved successfully',
        data: { ...reminder }
    })
})

test('❌ Should return 400 if reminderId is missing', async (t) => {
    const fastify = build()

    t.teardown(async () => {
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
        url: '/api/v1/reminders/', // invalid
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 404) // Fastify will return 404 for missing param route
})

test('❌ Should return 404 if reminder not found', async (t) => {
    const fastify = build()

    const fakeReminderId = faker.number.int()
    const stub = ImportMock.mockFunction(ReminderService, 'get', null)

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
        url: `/api/v1/reminders/${fakeReminderId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 404)
    t.match(res.json(), { message: 'No reminder found with the id' })
})

test('❌ Should return 500 if service throws an error', async (t) => {
    const fastify = build()

    const reminderId = faker.number.int()
    const stub = ImportMock.mockFunction(ReminderService, 'get', Promise.reject(new Error('DB error')))

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
        url: `/api/v1/reminders/${reminderId}`,
        headers: { Authorization: 'Bearer mock-token' }
    })

    t.equal(res.statusCode, 500)
})
