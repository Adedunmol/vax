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
            } 
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
            }
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
            }
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
            }
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
            }
        },
        deletePaymentHandler
    )
}

export default paymentRoutes