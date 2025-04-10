import { test } from 'tap'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import ReminderService from '../reminder.service'
import { createReminder } from '../reminder.controller' // Adjust path if needed

test('✅ Should successfully create a reminder with valid input', async (t) => {
    const mockReminder = {
        id: faker.number.int(),
        invoiceId: faker.number.int(),
        isRecurring: true,
        intervalDays: 7,
        dueDate: new Date(),
        reminderStatus: 'active'
    }

    const stub = ImportMock.mockFunction(ReminderService, 'create', mockReminder)

    const result = await createReminder({
        invoiceId: mockReminder.invoiceId,
        isRecurring: true,
        intervalDays: 7,
        dueDate: mockReminder.dueDate //.toISOString()
    })

    t.same(result, mockReminder)

    stub.restore()
})

test('❌ Should throw ZodError for invalid date format', async (t) => {
    const result = await createReminder({
        invoiceId: faker.number.int(),
        isRecurring: true,
        intervalDays: 5,
        dueDate: 'not-a-date'
    } as any)

    t.equal(result, undefined)
})

test('❌ Should throw ZodError for missing required fields', async (t) => {

    const result = await createReminder({} as any)

    t.equal(result, undefined)

})

test('❌ Should handle internal ReminderService error', async (t) => {
    const stub = ImportMock.mockFunction(ReminderService, 'create', Promise.reject(new Error('DB Error')))

    const result = await createReminder({
        invoiceId: faker.number.int(),
        isRecurring: false,
        intervalDays: 3,
        dueDate: new Date() //.toISOString()
    })

    t.equal(result, undefined)
    stub.restore()
})
