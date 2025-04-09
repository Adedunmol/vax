import { FastifyReply, FastifyRequest } from 'fastify'
import InvoiceService from './invoice.service'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'
import { createReminder } from '../reminder/reminder.controller'
import SettingsService from '../settings/settings.service'
import moment from "moment";


export const WeeklyInterval = 7

export async function createInvoiceHandler(request: FastifyRequest<{ Body: CreateInvoiceInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const settings = await SettingsService.get(userId)

        if (!settings) return reply.code(400).send({ message: 'No settings associated with user' })

        const invoice = await InvoiceService.create({ ...request.body, userId })

        const recurrentReminderData = {
            dueDate: invoice.dueDate || new Date(),
            isRecurring: settings?.recurrentReminders || true,
            intervalDays: settings?.recurrentInterval || WeeklyInterval,
            invoiceId: invoice.id
        }

        await createReminder(recurrentReminderData)

        const notifyBefore = moment(invoice.dueDate).subtract(settings.notify_before || 1, 'days').toDate()

        const beforeDueReminderData = {
            dueDate: notifyBefore,
            isRecurring: false,
            intervalDays: 0,
            invoiceId: invoice.id
        }

        await createReminder(beforeDueReminderData)

        return reply.code(201).send({ message: 'Invoice created successfully', data: { ...invoice } })
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