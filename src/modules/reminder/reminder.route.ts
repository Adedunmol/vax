import { FastifyInstance } from 'fastify'
import { $ref } from './reminder.schema'
import { $errorRef } from '../../errors/schema-base'
import { deleteReminderHandler, getAllRemindersHandler, getReminderHandler, updateReminderHandler } from './reminder.controller'

async function paymentRoutes(server: FastifyInstance) {

    server.get(
        '/:reminderId',
        {
            schema: {
                params: $ref('reminderParam'),
                response: {
                    200: $ref('reminderResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['reminders']
            },
            preHandler: [server.authenticate]
        },
        getReminderHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allRemindersResponse')
                },
                tags: ['reminders']
            },
            preHandler: [server.authenticate]
        },
        getAllRemindersHandler
    )

    server.patch(
        '/:reminderId',
        {
            schema: {
                params: $ref('reminderParam'),
                body: $ref('updateReminderSchema'),
                response: {
                    200: $ref('reminderResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['reminders']
            },
            preHandler: [server.authenticate]
        },
        updateReminderHandler
    )

    server.delete(
        '/:reminderId',
        {
            schema: {
                params: $ref('reminderParam'),
                response: {
                    200: $ref('reminderResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['reminders']
            },
            preHandler: [server.authenticate]
        },
        deleteReminderHandler
    )
}

export default paymentRoutes