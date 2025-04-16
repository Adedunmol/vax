import { eq, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'
import { invoices } from '../../db/schema/invoices'
import { items, reminders } from '../../db/schema'


class InvoiceService {

    async create(data: CreateInvoiceInput & { userId: number }) {
        const { due_date: dueDate, ...rest } = data

        const [invoice] = await db.insert(invoices).values({ ...rest, dueDate, createdBy: data.userId, createdFor: data.client_id }).returning()

        const invoiceId = invoice.id;

        const itemsToInsert = data.items?.map(item => ({
                invoiceId,
                units: item.units,
                rate: item.rate.toFixed(2),
                paid: false,
                description: item.description,
                total: (item.rate * item.units).toFixed(2),
        }));
        
        if (itemsToInsert) {
            await db.insert(items).values(itemsToInsert);
        }
    
        return invoice
    }

    async get(invoiceId: number, userId: number) {
        const invoice = db.query.invoices.findFirst({ 
            where: and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at)),
            with: {
                client: true
            }
        })
    
        return invoice
    }

    async getAll(userId: number) {
        const invoicesData = db.query.invoices.findMany({ 
            where: and(eq(invoices.createdBy, userId), isNull(invoices.deleted_at)),
            with: {
                client: true
            }
        })
    
        return invoicesData
    }

    async update(invoiceId: number, userId: number, updateObj: UpdateInvoiceInput) {
        const [invoice] = await db.update(invoices).set({ ...updateObj, updated_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at))).returning()

        return invoice
    }

    async delete(invoiceId: number, userId: number) {
        const invoice = await db.update(invoices).set({ deleted_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at))).returning()
        
        // cancel associated reminders
        await db.update(reminders).set({ canceled: true }).where(and(eq(reminders.invoiceId, invoiceId), eq(reminders.userId, userId)))

        return invoice
    }
}

export default new InvoiceService()