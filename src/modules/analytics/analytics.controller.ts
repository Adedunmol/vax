import { FastifyReply, FastifyRequest } from 'fastify'
import { ExpenseAnalytics, InvoiceAnalytics, ReminderAnalytics, RevenueAnalytics } from './analytics.service'

type Revenue = 'total' | 'monthly' | 'outstanding' | 'average' | 'top-clients' | 'payment-method'

export async function revenueHandler(request: FastifyRequest<{ Querystring: { type: Revenue } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let revenue: unknown

        switch (request.query.type) {
            case 'total':
                revenue = await new RevenueAnalytics().totalRevenue(userId)
                break
            case 'monthly':
                revenue = await new RevenueAnalytics().monthlyRevenue(userId)
                break
            case 'outstanding':
                revenue = await new RevenueAnalytics().outstandingRevenue(userId)
                break
            case 'average':
                revenue = await new RevenueAnalytics().averageRevenue(userId)
                break
            case 'top-clients':
                revenue = await new RevenueAnalytics().topClientsRevenue(userId)
                break
            case 'payment-method':
                revenue = await new RevenueAnalytics().paymentMethodsRevenue(userId)
                break
            default:
                return reply.code(400).send({ message: 'Revenue type is unknown' })
        }

        return reply.code(200).send({ message: 'Total revenue retrieved successfully', data: { revenue } })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

type Expense = 'total' | 'category' | 'trend' | 'ratio'

export async function expenseHandler(request: FastifyRequest<{ Querystring: { 'group_by': Expense } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let expense: unknown

        switch (request.query.group_by) {
            case 'total':
                expense = await new ExpenseAnalytics().totalExpenses(userId)
                break
            case 'category':
                expense = await new ExpenseAnalytics().categoryExpenses(userId)
                break
            case 'trend':
                expense = await new ExpenseAnalytics().trendExpenses(userId)
                break
            case 'ratio':
                expense = await new ExpenseAnalytics().ratioExpenses(userId)
                break

            default:
                return reply.code(400).send({ message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ message: 'Expense retrieved successfully', data: { expense } })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

type Invoice = 'late' | 'unpaid'

export async function invoiceHandler(request: FastifyRequest<{ Querystring: { 'group_by': Invoice } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let invoice: unknown

        switch (request.query.group_by) {
            case 'late':
                invoice = await new InvoiceAnalytics().latePaymentsInvoices(userId)
                break
            case 'unpaid':
                invoice = await new InvoiceAnalytics().unpaidInvoices(userId)
                break
            default:
                return reply.code(400).send({ message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ message: 'Invoice retrieved successfully', data: { invoice } })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

type Reminder = 'total-sent' | 'invoice'

export async function reminderHandler(request: FastifyRequest<{ Querystring: { 'group_by': Reminder, invoiceId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let reminder: unknown

        switch (request.query.group_by) {
            case 'total-sent':
                reminder = await new ReminderAnalytics().totalSentReminders(userId)
                break
            case 'invoice':
                if (!request.query.invoiceId) return reply.code(400).send({ message: 'invoiceId is required' })
                reminder = await new ReminderAnalytics().invoiceReminders(request.query.invoiceId, userId)
                break
            default:
                return reply.code(400).send({ message: 'Group by query is unknown' })
        }

        return reply.code(200).send({ message: 'Reminder retrieved successfully', data: { reminder } })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}