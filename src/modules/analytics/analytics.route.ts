import { FastifyInstance } from 'fastify'
import { reminderHandler, invoiceHandler, expenseHandler, revenueHandler } from './analytics.controller'
import { $ref } from './analytics.schema'
import { $errorRef } from '../../errors/schema-base'

async function userRoutes(server: FastifyInstance) {
    
    server.get(
        '/revenues',
        { 
            schema: { 
                querystring: $ref('revenueQuerySchema'),
                response: {
                    200: $ref('revenueResponse'),
                    400: $errorRef('errorSchema')
                }
            } 
        }, 
        revenueHandler
    )

    server.get(
        '/expenses',
        {
            schema: {
                querystring: $ref('expenseQuerySchema'),
                response: {
                    200: $ref('expenseResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        expenseHandler
    )

    server.get(
        '/invoices',
        {
            schema: {
                querystring: $ref('invoiceQuerySchema'),
                response: {
                    200: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        invoiceHandler
    )

    server.get(
        '/reminders',
        {
            schema: {
                querystring: $ref('reminderQuerySchema'),
                response: {
                    200: $ref('reminderResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        reminderHandler
    )
}

export default userRoutes