import db from "../../db";
import { invoices, payments, expenses, clients, reminders, users } from "../../db/schema";  
import { eq, and, sum, count, avg, sql, isNull, inArray } from "drizzle-orm";
import { logger } from "../../utils/logger";

class RevenueAnalytics {
    async totalRevenue(userId: number) {
        
        const [totalRevenue] = await db.select({ total: sum(invoices.totalAmount).mapWith(Number) }).from(invoices).where(and(eq(invoices.status, "paid"), eq(invoices.createdBy, userId)))

        return totalRevenue
    }

    async monthlyRevenue(userId: number) {
        const revenue = await db
                            .select({
                                month: sql<string>`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`,
                                total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` 
                            })
                            .from(payments)
                            .where(eq(payments.userId, userId))
                            .groupBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`)
                            .orderBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM') DESC`);

        return revenue
    }

    async outstandingRevenue(userId: number) {

        const [revenue] = await db
                        .select({
                            totalOutstanding: sql<number>`COALESCE(SUM(${invoices.totalAmount} - ${invoices.amountPaid}), 0)`
                        })
                        .from(invoices)
                        .where(
                            and(
                            inArray(invoices.status, ['unpaid', 'partially_paid', 'overdue']),
                            eq(invoices.createdBy, userId)
                            )
                        );

        return revenue
    }

    async averageRevenue(userId: number) {
        const [revenue] = await db.select({ avgRevenue: avg(invoices.totalAmount).mapWith(Number) })
                                .from(invoices)
                                .where(and(eq(invoices.status, "paid"), eq(invoices.createdBy, userId)))

        return revenue
    }

    async topClientsRevenue(userId: number) {
        const revenue = await db.select({
                                client: clients.firstName || ' ' || clients.lastName,
                                totalSpent: sql`SUM(${invoices.totalAmount})`.mapWith(Number).as('totalSpent'),
                            })
                            .from(invoices)
                            .innerJoin(clients, eq(invoices.createdFor, clients.id))
                            .where(eq(invoices.createdBy, userId))
                            .groupBy(clients.id)
                            .orderBy(sql`"totalSpent" DESC`)
                            .limit(5)

        return revenue
    }

    async paymentMethodsRevenue(userId: number) {
        const revenue = await db.select({
                                    method: payments.paymentMethod,
                                    total: sum(payments.amount).mapWith(Number)
                                })
                                .from(payments)
                                .where(eq(payments.userId, userId))
                                .groupBy(payments.paymentMethod)

        return revenue
    }
}

class ExpenseAnalytics {
    async totalExpenses(userId: number) {
        const [expensesData] = await db.select({ total: sum(expenses.amount).mapWith(Number) }).from(expenses).where(and(eq(expenses.userId, userId), isNull(expenses.deleted_at)))

        return expensesData
    }

    async categoryExpenses(userId: number) {
        const expensesData = await db.select({
                                        category: expenses.category,
                                        total: sum(expenses.amount).mapWith(Number)
                                    })
                                    .from(expenses)
                                    .where(and(eq(expenses.userId, userId), isNull(expenses.deleted_at)))
                                    .groupBy(expenses.category)

        return expensesData
    }

    async trendExpenses(userId: number) {
        const expensesData = await db.select({
                                        month: sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`.as("month"),
                                        total: sum(expenses.amount).mapWith(Number)
                                    })
                                    .from(expenses)
                                    .where(and(eq(expenses.userId, userId), isNull(expenses.deleted_at)))
                                    .groupBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`)
                                    .orderBy(sql`month DESC`)

        return expensesData
    }

    // async ratioExpenses(userId: number) {

    //     const totalRevenue = await new RevenueAnalytics().totalRevenue(userId)
    //     const totalExpenses = await this.totalExpenses(userId);

    //     return { ratio: Number(totalExpenses.total!) / (Number(totalRevenue.total!) || 1) };
    // }
}

class InvoiceAnalytics {
    async latePaymentsInvoices(userId: number) {
        const result = await db.select({
                                    id: invoices.id,
                                    clientId: invoices.createdFor,
                                    totalAmount: sql<number>`(${invoices.totalAmount})::NUMERIC`,
                                    dueDate: invoices.dueDate,
                                    paymentDate: payments.paymentDate,
                                    amountPaid: sql<number>`(${payments.amount})::NUMERIC`
                                })
                                .from(invoices)
                                .innerJoin(payments, eq(invoices.id, payments.invoiceId))
                                .where(
                                    and(
                                        sql`${payments.paymentDate} > ${invoices.dueDate}`,
                                        eq(invoices.createdBy, userId),
                                        isNull(invoices.deleted_at)
                                    )
                                )

        return result
    }

    async unpaidInvoices(userId: number) {
        const invoicesData = await db.select()
                                    .from(invoices)
                                    .where(and(eq(invoices.status, "unpaid"), eq(invoices.createdBy, userId), isNull(invoices.deleted_at)))

        return invoicesData
    }
}

class ReminderAnalytics {
    async totalSentReminders(userId: number) {
        const [remindersData] = await db.select({ count: count() })
                                        .from(reminders).where(eq(reminders.userId, userId))

        return remindersData
    }

    async invoiceReminders(invoiceId: number, userId: number) {
        const remindersData = await db.select()
                                        .from(reminders)
                                        .where(and(eq(reminders.userId, userId), eq(reminders.invoiceId, invoiceId)))

        return remindersData
    }

}

class ReportAnalytics {
    async dashboardReports(userId: number) {
        const revenue = await new RevenueAnalytics().totalRevenue(userId);
        const outstandingRevenue = await new RevenueAnalytics().outstandingRevenue(userId);
        const expenses = await new ExpenseAnalytics().totalExpenses(userId);
        const unpaidInvoices = await new InvoiceAnalytics().unpaidInvoices(userId);
        const remindersSent = await new ReminderAnalytics().totalSentReminders(userId);

        return {
            revenue,
            outstandingRevenue,
            expenses,
            unpaidInvoices,
            remindersSent
        };
    }
}

export const revenueAnalytics = new RevenueAnalytics()

export const expenseAnalytics = new ExpenseAnalytics()

export const invoiceAnalytics = new InvoiceAnalytics()

export const reminderAnalytics = new ReminderAnalytics()

export const reportAnalytics = new ReportAnalytics()