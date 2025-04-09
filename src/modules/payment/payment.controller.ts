import { FastifyReply, FastifyRequest } from 'fastify'
import PaymentService from './payment.service'
import { CreatePaymentInput, UpdatePaymentInput } from './payment.schema'

export async function createPaymentHandler(request: FastifyRequest<{ Body: CreatePaymentInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id
        
        const data = await PaymentService.create({ ...request.body, userId })

        return reply.code(201).send({ message: 'Payment created successfully', data })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getPaymentHandler(request: FastifyRequest<{ Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.paymentId) return reply.code(400).send({ message: 'paymentId is required' })

        const userId = request.user.id

        const payment = await PaymentService.get(request.params.paymentId, userId)

        if (!payment) return reply.code(404).send({ message: 'No payment found with the id' })

        return reply.code(200).send({ message: "Payment retrieved successfully", data: { ...payment } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllPaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const expenses = await PaymentService.getAll(userId)

        return reply.code(200).send({ message: "Payments retrieved successfully", data: { expenses } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updatePaymentHandler(request: FastifyRequest<{ Body: UpdatePaymentInput, Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.paymentId) return reply.code(400).send({ message: 'paymentId is required' })
       
        const payment = await PaymentService.update(request.params.paymentId, userId, request.body)

        return reply.code(200).send({ message: "Payment updated successfully", data: payment })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deletePaymentHandler(request: FastifyRequest<{ Params: { paymentId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.paymentId) return reply.code(400).send({ message: 'paymentId is required' })

        const userId = request.user.id

        const payment = await PaymentService.delete(request.params.paymentId, userId)

        return reply.code(200).send({ message: "Payment deleted successfully", data: { ...payment } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}