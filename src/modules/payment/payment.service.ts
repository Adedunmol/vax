import { eq, sql, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreatePaymentInput } from './payment.schema'
import { payments, invoices, reminders, invoiceStatus, Status } from '../../db/schema'

class PaymentService {

    async create(data: CreatePaymentInput & { userId: number }) {
        
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, data.invoice_id),
            columns: {
              amountPaid: true,
              totalAmount: true,
              status: true,
              id: true
            },
          });
          
        if (!invoice) return
          
        const newAmountPaid = Number(invoice.amountPaid!) + data.amount;
        
        // create payment entry
        const [payment] = await db.insert(payments).values({ amount: data.amount.toFixed(2), paymentDate: data.payment_date, paymentMethod: data.payment_method, invoiceId: data.invoice_id, userId: data.userId }).returning()
    
        const newStatus: Status = newAmountPaid >= Number(invoice.totalAmount!) ? 'paid' : 'partially_paid';

        const [updatedInvoice] = await db
                                    .update(invoices)
                                    .set({
                                        amountPaid: newAmountPaid.toFixed(2),
                                        status: sql`(${newStatus})::invoice_status`,
                                    })
                                    .where(eq(invoices.id, data.invoice_id))
                                    .returning();

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