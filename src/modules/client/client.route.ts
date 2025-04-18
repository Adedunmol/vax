import { FastifyInstance } from 'fastify'
import { $ref } from './client.schema'
import { $errorRef } from '../../errors/schema-base'
import { createClientHandler, deleteClientHandler, getAllClientsHandler, getClientHandler, getClientInvoicesHandler, updateClientHandler } from './client.controller'

async function clientRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createClientSchema'), 
                response: {
                    201: $ref('clientResponse'),
                    400: $errorRef('errorSchema'),
                    409: $errorRef('errorSchema')
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
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
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
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
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
        },
        getClientInvoicesHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allClientsResponse')
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
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
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
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
                },
                tags: ['clients']
            },
            preHandler: [server.authenticate]
        },
        deleteClientHandler
    )
}

export default clientRoutes