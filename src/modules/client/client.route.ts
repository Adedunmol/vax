import { FastifyInstance } from 'fastify'
import { $ref } from './client.schema'
import { $errorRef } from '../../errors/schema-base'
import { createClientHandler, deleteClientHandler, getAllClientsHandler, getClientHandler, getClientInvoicesHandler, updateClientHandler } from './client.controller'

async function userRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createClientSchema'), 
                response: {
                    201: $ref('clientResponse'),
                    400: $errorRef('errorSchema'),
                    409: $errorRef('errorSchema')
                }
            } 
        }, 
        createClientHandler 
    )

    server.get(
        '/:clientId',
        {
            schema: {
                params: $ref('getClientParam'),
                response: {
                    200: $ref('clientResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        getClientHandler
    )

    server.get(
        '/:clientId/invoices',
        {
            schema: {
                params: $ref('getClientParam'),
                response: {
                    200: $ref('invoiceResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        getClientInvoicesHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allClientsResponse')
                }
            }
        },
        getAllClientsHandler
    )

    server.patch(
        '/:clientId',
        {
            schema: {
                params: $ref('getClientParam'),
                body: $ref('updateClientSchema'),
                response: {
                    200: $ref('clientResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        updateClientHandler
    )

    server.delete(
        '/:clientId',
        {
            schema: {
                params: $ref('getClientParam'),
                response: {
                    200: $ref('clientResponse'),
                    400: $errorRef('errorSchema')
                }
            }
        },
        deleteClientHandler
    )
}

export default userRoutes