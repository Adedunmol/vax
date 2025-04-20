import { FastifyReply, FastifyRequest } from 'fastify'
import PaymentService from './payment.service'
import { CreatePaymentInput, UpdatePaymentInput } from './payment.schema'
import moment from 'moment'

export async function createPaymentHandler(request: FastifyRequest<{ Body: CreatePaymentInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id
        
        if (!moment(request.body.payment_date).isValid()) return reply.code(400).send({ status: 'error', message: 'payment_date is invalid' })

        const paymentDate = moment(request.body.payment_date).toDate()

        const data = await PaymentService.create({ ...request.body, userId, payment_date: paymentDate })

        if (!data) return reply.code(400).send({ status: 'error', message: 'no invoice found with id' })

        return reply.code(201).send({ status: 'success', message: 'Payment created successfully', data })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getPaymentHandler(request: FastifyRequest<{ Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.paymentId) return reply.code(400).send({ status: 'error', message: 'paymentId is required' })

        const userId = request.user.id

        const cachedPayment = await request.redis.get(`cache:payments:${request.params.paymentId}`)

        if (cachedPayment) return reply.code(200).send({ status: 'success', message: "Payment retrieved successfully", data: JSON.parse(cachedPayment) })

        const payment = await PaymentService.get(request.params.paymentId, userId)

        if (!payment) return reply.code(404).send({ status: 'error', message: 'No payment found with the id' })

        await request.redis.set(`cache:payments:${request.params.paymentId}`, JSON.stringify(payment))

        return reply.code(200).send({ status: 'success', message: "Payment retrieved successfully", data: payment })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllPaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const cachedPayments = await request.redis.get(`cache:payments:${userId}`)

        if (cachedPayments) return reply.code(200).send({ status: 'success', message: "Payments retrieved successfully", data: JSON.parse(cachedPayments) })

        const payments = await PaymentService.getAll(userId)

        if (payments.length > 0) await request.redis.set(`cache:payments:${userId}`, JSON.stringify(payments))

        return reply.code(200).send({ status: 'success', message: "Payments retrieved successfully", data: payments })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updatePaymentHandler(request: FastifyRequest<{ Body: UpdatePaymentInput, Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.paymentId) return reply.code(400).send({ status: 'error', message: 'paymentId is required' })
       
        const payment = await PaymentService.update(request.params.paymentId, userId, request.body)

        return reply.code(200).send({ status: 'success', message: "Payment updated successfully", data: payment })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deletePaymentHandler(request: FastifyRequest<{ Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.paymentId) return reply.code(400).send({ status: 'error', message: 'paymentId is required' })

        const userId = request.user.id

        const payment = await PaymentService.delete(request.params.paymentId, userId)

        return reply.code(200).send({ status: 'success', message: "Payment deleted successfully", data: payment })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}