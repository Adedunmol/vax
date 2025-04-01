import db from "../../db";
import { invoices, payments, expenses, clients, reminders, users } from "../../db/schema";  
import { eq, and, sum, count, desc, avg, sql } from "drizzle-orm";

export class RevenueAnalytics {
    async totalRevenue(userId: number) {
        
        const [total] = await db.select({ total: sum(invoices.totalAmount) }).from(invoices).where(and(eq(invoices.status, "paid"), eq(invoices.createdBy, userId)))

        return total
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
                                        sql`${invoices.status} IN ('pending', 'partially_paid', 'overdue')`,
                                        eq(invoices.createdBy, userId)
                                    )
                                )

        return revenue
    }

    async averageRevenue(userId: number) {
        const [revenue] = await db.select({ avgRevenue: avg(invoices.totalAmount) })
                                .from(invoices)
                                .where(and(eq(invoices.status, "paid"), eq(invoices.createdBy, userId)))

        return revenue
    }

    async topClientsRevenue(userId: number) {
        const revenue = await db.select({
                                client: clients.firstName || ' ' || clients.lastName,
                                totalSpent: sum(invoices.totalAmount)
                            })
                            .from(invoices)
                            .innerJoin(clients, eq(invoices.createdFor, clients.id))
                            .where(eq(invoices.createdBy, userId))
                            .groupBy(clients.id)
                            .orderBy(sql`totalSpent DESC`)
                            .limit(5)

        return revenue
    }

    async paymentMethodsRevenue(userId: number) {
        const revenue = await db.select({
                                    method: payments.paymentMethod,
                                    total: sum(payments.amount)
                                })
                                .from(payments)
                                .where(eq(payments.userId, userId))
                                .groupBy(payments.paymentMethod)

        return revenue
    }
}

export class ExpenseAnalytics {
    async totalExpenses(userId: number) {
        const [expensesData] = await db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.userId, userId))

        return expensesData
    }

    async categoryExpenses(userId: number) {
        const expensesData = await db.select({
                                        category: expenses.category,
                                        total: sum(expenses.amount)
                                    })
                                    .from(expenses)
                                    .where(eq(expenses.userId, userId))
                                    .groupBy(expenses.category)

        return expensesData
    }

    async trendExpenses(userId: number) {
        const expensesData = await db.select({
                                        month: sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`.as("month"),
                                        total: sum(expenses.amount)
                                    })
                                    .from(expenses)
                                    .where(eq(expenses.userId, userId))
                                    .groupBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`)
                                    .orderBy(sql`month DESC`)

        return expensesData
    }

    async ratioExpenses(userId: number) {

        const totalRevenue = await new RevenueAnalytics().totalRevenue(userId)
        const totalExpenses = await this.totalExpenses(userId);
        return Number(totalExpenses!) / (Number(totalRevenue!) || 1);
    }
}

export class InvoiceAnalytics {
    async averagePaymentTime() {}

    async latePaymentsInvoices() {}

    async unpaidInvoices() {}
}

export class ReminderAnalytics {
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

export class ReportAnalytics {
    async dashboardReports(userId: number) {
        const revenue = await new RevenueAnalytics().totalRevenue(userId);
        const outstandingRevenue = await new RevenueAnalytics().outstandingRevenue(userId);
        const expenses = await new ExpenseAnalytics().totalExpenses(userId);
        const unpaidInvoices = await new InvoiceAnalytics().unpaidInvoices();
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