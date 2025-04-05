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
                }
            }
        },
        getReminderHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allRemindersResponse')
                }
            }
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
                }
            }
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
                }
            }
        },
        deleteReminderHandler
    )
}

export default paymentRoutes