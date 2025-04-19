import { FastifyReply, FastifyRequest } from 'fastify'
import InvoiceService from './invoice.service'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'
import { createReminder } from '../reminder/reminder.controller'
import SettingsService from '../settings/settings.service'
import moment from "moment";
import { logger } from '../../utils/logger'

export const WeeklyInterval = 7

export async function createInvoiceHandler(request: FastifyRequest<{ Body: CreateInvoiceInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const settings = await SettingsService.get(userId)

        if (!settings) return reply.code(400).send({ status: 'error', message: 'No settings associated with user' })

        if (!moment(request.body.due_date).isValid()) return reply.code(400).send({ status: 'error', message: 'due_date is invalid' })

        if (moment(request.body.due_date).isBefore(new Date())) return reply.code(400).send({ status: 'error', message: 'due_date must be in the future' })

        const dueDate = moment(request.body.due_date).toDate()

        const invoice = await InvoiceService.create({ ...request.body, userId, due_date: dueDate })

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

        return reply.code(201).send({ status: 'success', message: 'Invoice created successfully', data: invoice })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getInvoiceHandler(request: FastifyRequest<{ Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.invoiceId) return reply.code(400).send({ status: 'error', message: 'invoiceId is required' })

        const userId = request.user.id

        const invoice = await InvoiceService.get(request.params.invoiceId, userId)

        if (!invoice) return reply.code(404).send({ status: 'success', message: 'No invoice found with the id' })


        return reply.code(200).send({ status: 'success', message: "Invoice retrieved successfully", data: invoice })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const invoices = await InvoiceService.getAll(userId)

        return reply.code(200).send({ status: 'success', message: "Invoices retrieved successfully", data: invoices })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updateInvoiceHandler(request: FastifyRequest<{ Body: UpdateInvoiceInput, Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.invoiceId) return reply.code(400).send({ status: 'error', message: 'invoiceId is required' })
       
        const invoice = await InvoiceService.update(request.params.invoiceId, userId, request.body)

        return reply.code(200).send({ status: 'success', message: "Invoice updated successfully", data: invoice })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteInvoiceHandler(request: FastifyRequest<{ Params: { invoiceId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.invoiceId) return reply.code(400).send({ status: 'error', message: 'invoiceId is required' })

        const userId = request.user.id

        const invoice = await InvoiceService.delete(request.params.invoiceId, userId)

        if (!invoice) return reply.code(404).send({ status: 'success', message: 'No invoice found with the id' })

        return reply.code(200).send({ status: 'success', message: "Invoice deleted successfully", data: invoice })
    } catch (err: any) {
        return reply.code(500).send({ status: 'error', message: err })
    }
}