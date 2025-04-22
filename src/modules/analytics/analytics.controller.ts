import { FastifyReply, FastifyRequest } from 'fastify'
import { expenseAnalytics, invoiceAnalytics, reminderAnalytics, reportAnalytics, revenueAnalytics } from './analytics.service'
import { ExpenseQuery, InvoiceQuery, ReminderQuery, RevenueQuery } from './analytics.schema'

export async function revenueHandler(request: FastifyRequest<{ Querystring: RevenueQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let revenue: object
        let cachedRevenue: string | null

        switch (request.query.type) {
            case 'total':
                cachedRevenue = await request.redis.get(`cache:total-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.totalRevenue(userId)

                await request.redis.set(`cache:total-revenue:${userId}`, JSON.stringify(revenue))
                break
            case 'monthly':
                cachedRevenue = await request.redis.get(`cache:monthly-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.monthlyRevenue(userId)

                await request.redis.set(`cache:monthly-revenue:${userId}`, JSON.stringify(revenue))

                break
            case 'outstanding':
                cachedRevenue = await request.redis.get(`cache:outstanding-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.outstandingRevenue(userId)

                await request.redis.set(`cache:outstanding-revenue:${userId}`, JSON.stringify(revenue))

                break
            case 'average':
                cachedRevenue = await request.redis.get(`cache:average-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.averageRevenue(userId)

                await request.redis.set(`cache:average-revenue:${userId}`, JSON.stringify(revenue))

                break
            case 'top-clients':
                cachedRevenue = await request.redis.get(`cache:clients-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.topClientsRevenue(userId)

                await request.redis.set(`cache:clients-revenue:${userId}`, JSON.stringify(revenue))

                break
            case 'payment-method':
                cachedRevenue = await request.redis.get(`cache:payments-revenue:${userId}`)

                if (cachedRevenue) return reply.code(200).send({ status: 'success', message: "Revenue retrieved successfully", data: JSON.parse(cachedRevenue) })

                revenue = await revenueAnalytics.paymentMethodsRevenue(userId)

                await request.redis.set(`cache:payments-revenue:${userId}`, JSON.stringify(revenue))

                break
            default:
                return reply.code(400).send({ status: 'error', message: 'Revenue type is unknown' })
        }

        return reply.code(200).send({ status: 'success', message: 'Revenue retrieved successfully', data: revenue })
    } catch (err) {
        return reply.code(500).send(err)
    }  
}

export async function expenseHandler(request: FastifyRequest<{ Querystring: ExpenseQuery }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        let expense: unknown
        let cachedExpense: string | null

        switch (request.query.type) {
            case 'total':
                cachedExpense = await request.redis.get(`cache:total-expense:${userId}`)

                if (cachedExpense) return reply.code(200).send({ status: 'success', message: "Expense retrieved successfully", data: JSON.parse(cachedExpense) })

                expense = await expenseAnalytics.totalExpenses(userId)

                await request.redis.set(`cache:total-expense:${userId}`, JSON.stringify(expense))

                break
            case 'category':
                cachedExpense = await request.redis.get(`cache:category-expense:${userId}`)

                if (cachedExpense) return reply.code(200).send({ status: 'success', message: "Expense retrieved successfully", data: JSON.parse(cachedExpense) })

                expense = await expenseAnalytics.categoryExpenses(userId)

                await request.redis.set(`cache:category-expense:${userId}`, JSON.stringify(expense))

                break
            case 'trend':
                cachedExpense = await request.redis.get(`cache:trend-expense:${userId}`)

                if (cachedExpense) return reply.code(200).send({ status: 'success', message: "Expense retrieved successfully", data: JSON.parse(cachedExpense) })

                expense = await expenseAnalytics.trendExpenses(userId)

                await request.redis.set(`cache:trend-expense:${userId}`, JSON.stringify(expense))

                break
            // case 'ratio':
            //     cachedExpense = await request.redis.get(`cache:ratio-expense:${userId}`)

            //     if (cachedExpense) return reply.code(200).send({ status: 'success', message: "Expense retrieved successfully", data: JSON.parse(cachedExpense) })

            //     expense = await expenseAnalytics.ratioExpenses(userId)

            //     await request.redis.set(`cache:ratio-expense:${userId}`, JSON.stringify(expense))

            //     break
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
        let cachedInvoice: string | null

        switch (request.query.type) {
            case 'late':
                cachedInvoice = await request.redis.get(`cache:late-invoice:${userId}`)

                if (cachedInvoice) return reply.code(200).send({ status: 'success', message: "Invoice retrieved successfully", data: JSON.parse(cachedInvoice) })

                invoice = await invoiceAnalytics.latePaymentsInvoices(userId)

                await request.redis.set(`cache:late-invoice:${userId}`, JSON.stringify(invoice))

                break
            case 'unpaid':
                cachedInvoice = await request.redis.get(`cache:unpaid-invoice:${userId}`)

                if (cachedInvoice) return reply.code(200).send({ status: 'success', message: "Invoice retrieved successfully", data: JSON.parse(cachedInvoice) })

                invoice = await invoiceAnalytics.unpaidInvoices(userId)

                await request.redis.set(`cache:unpaid-invoice:${userId}`, JSON.stringify(invoice))

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
        let cachedReminder

        switch (request.query.type) {
            case 'total-sent':
                cachedReminder = await request.redis.get(`cache:total-reminder:${userId}`)

                if (cachedReminder) return reply.code(200).send({ status: 'success', message: "Reminder retrieved successfully", data: JSON.parse(cachedReminder) })

                reminder = await reminderAnalytics.totalSentReminders(userId)

                await request.redis.set(`cache:total-reminder:${userId}`, JSON.stringify(reminder))

                break
            case 'invoice':
                if (!request.query.invoiceId) return reply.code(400).send({ status: 'error', message: 'invoiceId is required' })

                cachedReminder = await request.redis.get(`cache:invoice-reminder:${request.query.invoiceId}`)

                if (cachedReminder) return reply.code(200).send({ status: 'success', message: "Reminder retrieved successfully", data: JSON.parse(cachedReminder) })

                reminder = await reminderAnalytics.invoiceReminders(request.query.invoiceId, userId)

                await request.redis.set(`cache:invoice-reminder:${request.query.invoiceId}`, JSON.stringify(reminder))

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

        const cachedDashboard = await request.redis.get(`cache:dashboard:${userId}`)

        if (cachedDashboard) return reply.code(200).send({ status: 'success', message: "Dashboard report retrieved successfully", data: JSON.parse(cachedDashboard) })

        const dashboard = await reportAnalytics.dashboardReports(userId)

        await request.redis.set(`cache:dashboard:${userId}`, JSON.stringify(dashboard))

        return reply.code(200).send({ status: 'success', message: 'Dashboard report retrieved successfully', data: dashboard })
    } catch (err) {
        return reply.code(500).send(err)
    }
}