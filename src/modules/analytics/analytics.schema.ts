import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'


const responseCore = {
    status: z.string(),
    message: z.string()
}

const revenueQuerySchema = z.object({
    type: z.enum(['total', 'monthly', 'outstanding', 'average', 'top-clients', 'payment-method'])
})

const totalRevenueResponse = z.object({
    ...responseCore,
    data: z.object({ total: z.number() })
})

const monthlyRevenueResponse = z.object({
    ...responseCore,
    data: z.object({
        total: z.number(),
        month: z.string()
    })
})

const outstandingRevenueResponse = z.object({
    ...responseCore,
    data: z.object({ totalOutstanding: z.number() })
})

const averageRevenueResponse = z.object({
    ...responseCore,
    data: z.object({ avgRevenue: z.number() })
})

const topClientsRevenueResponse = z.object({ 
    ...responseCore,
    data: z.array(
        z.object({
            totalSpent: z.number(),
            client: z.string()
    })
)
})
const paymentMethodsRevenueResponse = z.object({
    ...responseCore,
    data: z.array(
        z.object({
            total: z.number(),
            method: z.string()
        })
    )
})

const revenueResponse = z.object({
    ...responseCore,
    data: z.union([
        totalRevenueResponse, 
        monthlyRevenueResponse, 
        outstandingRevenueResponse, 
        averageRevenueResponse,
        topClientsRevenueResponse,
        paymentMethodsRevenueResponse
    ])
})

const expenseQuerySchema = z.object({
    type: z.enum(['total', 'category', 'trend', 'ratio'])
})

const totalExpenseResponse = z.object({
    ...responseCore,
    data: z.object({ total: z.number() })
})

const categoryExpenseResponse = z.object({
    ...responseCore,
    data: z.object({
        total: z.number(),
        category: z.string()
    })
})

const trendExpenseResponse = z.object({
    ...responseCore,
    data: z.object({
        total: z.number(),
        month: z.string()
    })
})

const ratioExpenseResponse = z.object({
    ...responseCore,
    data: z.object({ ratio: z.number() })
})

const expenseResponse = z.object({
    ...responseCore,
    data: z.union([
        totalExpenseResponse,
        categoryExpenseResponse,
        trendExpenseResponse,
        ratioExpenseResponse
    ])
})

const invoiceQuerySchema = z.object({
    type: z.enum(['late', 'unpaid'])
})

const latePaymentsResponse = z.object({
    ...responseCore,
    data: z.array(
        z.object({
            id: z.number(),
            clientId: z.number(),
            totalAmount: z.number(),
            dueDate: z.date(),
            paymentDate: z.date(),
            amountPaid: z.number()
        })
    )
})

const unpaidInvoicesResponse = z.object({
    ...responseCore,
    data: z.array(
        z.object({
            invoiceId: z.number()
        })
    )
})

const invoiceResponse = z.object({
    ...responseCore,
    data: z.union([
        latePaymentsResponse,
        unpaidInvoicesResponse
    ])
}) 

const reminderQuerySchema = z.object({
    type: z.enum(['total-sent', 'invoice']),
    invoiceId: z.number({ required_error: 'invoiceId is required' })
})

const totalRemindersResponse = z.object({
    ...responseCore,
    data: z.object({ count: z.number() })
})

const invoiceRemindersResponse = z.object({
    ...responseCore,
    data: z.array(
        z.object({
            id: z.number(),
            clientId: z.number(),
            dueDate: z.date(),
            invoiceId: z.number(),
            updated_at: z.date(),
            created_at: z.date(),
            deleted_at: z.date(),
            userId: z.number(),
            canceled: z.boolean(),
            reminderStatus: z.enum(['pending', 'sent', 'scheduled', 'canceled'])
        })
    )
}) 

const reminderResponse = z.object({
    ...responseCore,
    data: z.union([
        totalRemindersResponse,
        invoiceRemindersResponse
    ])
})

const dashboardResponse = z.object({
    ...responseCore,
    data: z.object({
        revenue: totalRevenueResponse,
        outstandingRevenue: outstandingRevenueResponse,
        expenses: expenseResponse,
        unpaidInvoices: unpaidInvoicesResponse,
        remindersSent: z.object({ count: z.number() })
    })
})

export type RevenueQuery = z.infer<typeof revenueQuerySchema>
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>
export type ReminderQuery = z.infer<typeof reminderQuerySchema>

export const { schemas: analyticsSchemas, $ref } = buildJsonSchemas({
    revenueQuerySchema,
    revenueResponse,
    expenseQuerySchema,
    expenseResponse,
    invoiceQuerySchema,
    invoiceResponse,
    reminderQuerySchema,
    reminderResponse,
    dashboardResponse
}, { '$id': 'AnalyticsSchema' })