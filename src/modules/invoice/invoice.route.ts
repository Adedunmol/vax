import { FastifyInstance } from 'fastify'
import { $ref } from './invoice.schema'
import { $errorRef } from '../../errors/schema-base'
import { createInvoiceHandler, deleteInvoiceHandler, getAllInvoicesHandler, getInvoiceHandler, updateInvoiceHandler } from './invoice.controller'

async function invoiceRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createInvoiceSchema'), 
                response: {
                    201: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            } 
        }, 
        createInvoiceHandler
    )

    server.get(
        '/:invoiceId',
        {
            schema: {
                params: $ref('invoiceParam'),
                response: {
                    200: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        getInvoiceHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allInvoicesResponse')
                }
            }
        },
        getAllInvoicesHandler
    )

    server.patch(
        '/:invoiceId',
        {
            schema: {
                params: $ref('invoiceParam'),
                body: $ref('updateInvoiceSchema'),
                response: {
                    200: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        updateInvoiceHandler
    )

    server.delete(
        '/:invoiceId',
        {
            schema: {
                params: $ref('invoiceParam'),
                response: {
                    200: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        deleteInvoiceHandler
    )
}

export default invoiceRoutes