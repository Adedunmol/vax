import { FastifyInstance } from 'fastify'
import { $ref } from './expenses.schema'
import { $errorRef } from '../../errors/schema-base'
import { createExpenseHandler, deleteExpenseHandler, getAllExpensesHandler, getExpenseHandler, updateExpenseHandler } from './expenses.controller'

async function expenseRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createExpenseSchema'), 
                response: {
                    201: $ref('expenseResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['expenses']
            },
            preHandler: [server.authenticate]
        }, 
        createExpenseHandler
    )

    server.get(
        '/:expenseId',
        {
            schema: {
                params: $ref('expenseParam'),
                response: {
                    200: $ref('expenseResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['expenses']
            },
            preHandler: [server.authenticate]
        },
        getExpenseHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allExpensesResponse')
                },
                tags: ['expenses']
            },
            preHandler: [server.authenticate]
        },
        getAllExpensesHandler
    )

    server.patch(
        '/:expenseId',
        {
            schema: {
                params: $ref('expenseParam'),
                body: $ref('updateExpenseSchema'),
                response: {
                    200: $ref('expenseResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['expenses']
            },
            preHandler: [server.authenticate]
        },
        updateExpenseHandler
    )

    server.delete(
        '/:expenseId',
        {
            schema: {
                params: $ref('expenseParam'),
                response: {
                    200: $ref('expenseResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['expenses']
            },
            preHandler: [server.authenticate]
        },
        deleteExpenseHandler
    )
}

export default expenseRoutes