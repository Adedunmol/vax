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
                }
            } 
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
                }
            }
        },
        getExpenseHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allExpensesResponse')
                }
            }
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
                }
            }
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
                }
            }
        },
        deleteExpenseHandler
    )
}

export default expenseRoutes