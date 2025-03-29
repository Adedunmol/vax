import { FastifyReply, FastifyRequest } from 'fastify'
import InvoiceService from './invoice.service'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'

export async function createInvoiceHandler(request: FastifyRequest<{ Body: CreateInvoiceInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const data = await InvoiceService.create({ ...request.body, userId })

        return reply.code(201).send({ message: 'Invoice created successfully', data })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getInvoiceHandler(request: FastifyRequest<{ Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.invoiceId) return reply.code(400).send({ message: 'invoiceId is required' })

        const userId = request.user.id

        const invoice = await InvoiceService.get(request.params.invoiceId, userId)

        if (!invoice) return reply.code(404).send({ message: 'No invoice found with the id' })

        return reply.code(200).send({ message: "Invoice retrieved successfully", data: { ...invoice } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const invoices = await InvoiceService.getAll(userId)

        return reply.code(200).send({ message: "Invoices retrieved successfully", data: { invoices } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getClientInvoicesHandler() {}

export async function updateInvoiceHandler(request: FastifyRequest<{ Body: UpdateInvoiceInput, Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.invoiceId) return reply.code(400).send({ message: 'invoiceId is required' })
       
        const invoice = await InvoiceService.update(request.params.invoiceId, userId, request.body)

        return reply.code(200).send({ message: "Invoice updated successfully", data: { ...invoice } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteInvoiceHandler(request: FastifyRequest<{ Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.invoiceId) return reply.code(400).send({ message: 'invoiceId is required' })

        const userId = request.user.id

        const invoice = await InvoiceService.delete(request.params.invoiceId, userId)

        return reply.code(200).send({ message: "Invoice deleted successfully", data: { ...invoice } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}