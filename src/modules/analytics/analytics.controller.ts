import { FastifyReply, FastifyRequest } from 'fastify'
import { expenseAnalytics, invoiceAnalytics, reminderAnalytics, reportAnalytics, revenueAnalytics } from './analytics.service'
import { ExpenseQuery, InvoiceQuery, ReminderQuery, RevenueQuery } from './analytics.schema'

export async function revenueHandler(request: FastifyRequest<{ Querystring: RevenueQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let revenue: unknown

        switch (request.query.type) {
            case 'total':
                revenue = await revenueAnalytics.totalRevenue(userId)
                break
            case 'monthly':
                revenue = await revenueAnalytics.monthlyRevenue(userId)
                break
            case 'outstanding':
                revenue = await revenueAnalytics.outstandingRevenue(userId)
                break
            case 'average':
                revenue = await revenueAnalytics.averageRevenue(userId)
                break
            case 'top-clients':
                revenue = await revenueAnalytics.topClientsRevenue(userId)
                break
            case 'payment-method':
                revenue = await revenueAnalytics.paymentMethodsRevenue(userId)
                break
            default:
                return reply.code(400).send({ message: 'Revenue type is unknown' })
        }

        return reply.code(200).send({ message: 'Total revenue retrieved successfully', data: revenue })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

export async function expenseHandler(request: FastifyRequest<{ Querystring: ExpenseQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let expense: unknown

        switch (request.query.type) {
            case 'total':
                expense = await expenseAnalytics.totalExpenses(userId)
                break
            case 'category':
                expense = await expenseAnalytics.categoryExpenses(userId)
                break
            case 'trend':
                expense = await expenseAnalytics.trendExpenses(userId)
                break
            case 'ratio':
                expense = await expenseAnalytics.ratioExpenses(userId)
                break
            default:
                return reply.code(400).send({ status: 'error', message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ status: 'success', message: 'Expense retrieved successfully', data: expense })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

export async function invoiceHandler(request: FastifyRequest<{ Querystring: InvoiceQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let invoice: unknown

        switch (request.query.type) {
            case 'late':
                invoice = await invoiceAnalytics.latePaymentsInvoices(userId)
                break
            case 'unpaid':
                invoice = await invoiceAnalytics.unpaidInvoices(userId)
                break
            default:
                return reply.code(400).send({ status: 'error', message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ status: 'success', message: 'Invoice retrieved successfully', data: invoice })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}


export async function reminderHandler(request: FastifyRequest<{ Querystring: ReminderQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let reminder: unknown

        switch (request.query.type) {
            case 'total-sent':
                reminder = await reminderAnalytics.totalSentReminders(userId)
                break
            case 'invoice':
                if (!request.query.invoiceId) return reply.code(400).send({ message: 'invoiceId is required' })
                reminder = await reminderAnalytics.invoiceReminders(request.query.invoiceId, userId)
                break
            default:
                return reply.code(400).send({ status: 'error', message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ status: 'success', message: 'Reminder retrieved successfully', data: reminder })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

export async function dashboardHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const dashboard = await reportAnalytics.dashboardReports(userId)

        return reply.code(200).send({ status: 'success', message: 'Dashboard report retrived successfully', data: dashboard })
    } catch (err) {
        return reply.code(500).send(err)
    }
}