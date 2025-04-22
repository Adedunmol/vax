import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const revenueQuerySchema = z.object({
    type: z.enum(['total', 'monthly', 'outstanding', 'average', 'top-clients', 'payment-method'])
})

const totalRevenueCore = z.object({ total: z.number() })

const monthlyRevenueCore = z.array(z.object({
    total: z.number(),
    month: z.string()
}))

const outstandingRevenueCore = z.object({ totalOutstanding: z.number() })

const averageRevenueCore = z.object({ avgRevenue: z.number() })

const topClientsRevenueCore = z.array(
    z.object({
        totalSpent: z.number(),
        client: z.string()
})
)

const paymentMethodsRevenueCore = z.array(
    z.object({
        total: z.number(),
        method: z.string()
    })
)

const revenueResponse = z.object({
    ...responseCore,
    data: z.any()
})

const expenseQuerySchema = z.object({
    type: z.enum(['total', 'category', 'trend']) // , 'ratio'
})

const totalExpenseCore = z.object({ total: z.number() })

const categoryExpenseCore = z.object({
    total: z.number(),
    category: z.string()
})

const trendExpenseCore = z.object({
    total: z.number(),
    month: z.string()
})

const ratioExpenseCore = z.object({ ratio: z.number() })

const expenseResponse = z.object({
    ...responseCore,
    data: z.any()
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
    data: z.any()
}) 

const reminderQuerySchema = z.object({
    type: z.enum(['total-sent', 'invoice']),
    invoiceId: z.number().optional()
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
    data: z.any()
})

const dashboardResponse = z.object({
    ...responseCore,
    data: z.object({
        revenue: totalRevenueCore,
        outstandingRevenue: outstandingRevenueCore,
        expenses: z.object({
            total: z.number()
        }),
        unpaidInvoices: z.array(z.object({
            status: z.enum(["unpaid", "partially_paid", "paid", "overdue"]),
            id: z.number(),
            updated_at: z.date(),
            created_at: z.date(),
            deleted_at: z.date(),
            createdBy: z.number(),
            createdFor: z.number(),
            totalAmount: z.number(),
            amountPaid: z.number(),
            description: z.string(),
            dueDate: z.date(),
            items: z.array(z.object({
                id: z.number(),
                description: z.string(),
                invoiceId: z.number(),
                units: z.number(),
                rate: z.string(),
                total: z.string(),
            })).optional()
        })),
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