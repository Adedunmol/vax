import { eq, sql, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreatePaymentInput } from './payment.schema'
import { payments, invoices, reminders } from '../../db/schema'

class PaymentService {

    async create(data: CreatePaymentInput & { userId: number }) {
        // create payment entry
        const [payment] = await db.insert(payments).values({ amount: data.amount.toFixed(2), paymentDate: data.payment_date, paymentMethod: data.payment_method, invoiceId: data.invoice_id }).returning()
    
        // update the amount_paid in invoice and if the amount_paid == total_amount, set status to paid, else set to partially paid
        const [invoice] = await db.update(invoices)
                                .set({
                                        amountPaid: sql`${invoices.amountPaid} + ${data.amount}`, // Increment `amount_paid`
                                        status: sql`CASE 
                                                        WHEN ${invoices.amountPaid} + ${data.amount} >= ${invoices.totalAmount} 
                                                        THEN 'paid' 
                                                        ELSE 'partially_paid' 
                                                    END`, // Update `status` based on amount_paid
                                })
                                .where(eq(invoices.id, data.invoice_id)).returning()

        if (invoice.status === 'paid') {
            await db.update(reminders).set({ reminderStatus: 'canceled' }).where(eq(reminders.invoiceId, invoice.id)).returning()    
        }

        return payment
    }
    
    async get(paymentId: number, userId: number) {
        const payment = db.query.payments.findFirst({ where: and(eq(payments.id, paymentId), eq(payments.userId, userId), isNull(reminders.deleted_at)) })
    
        return payment
    }

    async getAll(userId: number) {
        const paymentsData = db.query.payments.findMany({ where: and(eq(payments.userId, userId), isNull(payments.deleted_at)) })
    
        return paymentsData
    }

    async update(paymentId: number, userId: number, updateObj: any) {
        // if the amount field is being modified, update the amount_paid in the invoices table

        const [payment] = await db.update(payments).set({ ...updateObj, updated_at: new Date() }).where(and(eq(payments.id, paymentId), eq(payments.userId, userId), isNull(reminders.deleted_at))).returning()

        return payment
    }

    async delete(paymentId: number, userId: number) {
        const [payment] = await db.update(payments).set({ deleted_at: new Date() }).where(and(eq(payments.id, paymentId), eq(payments.userId, userId), isNull(reminders.deleted_at))).returning()

        if (payment) {
            await db.update(invoices).set({ amountPaid: (Number(invoices.amountPaid) - Number(payment?.amount)).toFixed(2) }).where(and(eq(invoices.id, payment.invoiceId!), eq(invoices.createdBy, userId)))
        }
    
        return payment
    }

}

export default new PaymentService()