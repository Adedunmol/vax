import { FastifyInstance } from 'fastify'
import { $ref } from './payment.schema'
import { $errorRef } from '../../errors/schema-base'
import { createPaymentHandler, deletePaymentHandler, getAllPaymentsHandler, getPaymentHandler, updatePaymentHandler } from './payment.controller'

async function paymentRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createPaymentSchema'), 
                response: {
                    201: $ref('paymentResponse'),
                    400: $errorRef('errorSchema')
                }
            },
            preHandler: [server.authenticate]
        }, 
        createPaymentHandler
    )

    server.get(
        '/:paymentId',
        {
            schema: {
                params: $ref('paymentParam'),
                response: {
                    200: $ref('paymentResponse'),
                    400: $errorRef('errorSchema')
                }
            },
            preHandler: [server.authenticate]
        },
        getPaymentHandler
    )

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('allPaymentsResponse')
                }
            },
            preHandler: [server.authenticate]
        },
        getAllPaymentsHandler
    )

    server.patch(
        '/:paymentId',
        {
            schema: {
                params: $ref('paymentParam'),
                body: $ref('updatePaymentSchema'),
                response: {
                    200: $ref('paymentResponse'),
                    400: $errorRef('errorSchema')
                }
            },
            preHandler: [server.authenticate]
        },
        updatePaymentHandler
    )

    server.delete(
        '/:paymentId',
        {
            schema: {
                params: $ref('paymentParam'),
                response: {
                    200: $ref('paymentResponse'),
                    400: $errorRef('errorSchema')
                }
            },
            preHandler: [server.authenticate]
        },
        deletePaymentHandler
    )
}

export default paymentRoutes