import { eq, and, isNull, InferSelectModel } from 'drizzle-orm'
import db from '../../db'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'
import { invoices } from '../../db/schema/invoices'
import { clients, items, reminders } from '../../db/schema'

type Items = InferSelectModel<typeof items>

class InvoiceService {

    async create(data: CreateInvoiceInput & { userId: number }) {
        const { due_date: dueDate, ...rest } = data
        let totalAmount = 0

        data.items?.forEach(item => {
            totalAmount += (item.rate * item.units)
        })        

        const [invoice] = await db.insert(invoices).values({ ...rest, dueDate, createdBy: data.userId, createdFor: data.client_id, totalAmount: totalAmount.toFixed(2) }).returning()

        const invoiceId = invoice.id;

        const itemsToInsert = data.items?.map(item => ({
                invoiceId,
                units: item.units,
                rate: item.rate.toFixed(2),
                paid: false,
                description: item.description,
                total: (item.rate * item.units).toFixed(2),
        }));
        
        let itemValues: Items[] = []
        if (itemsToInsert) {
            itemValues = await db.insert(items).values(itemsToInsert).returning();
        }
    
        return { ...invoice, items: itemValues }
    }

    async get(invoiceId: number, userId: number) {
        const [invoice] = await db.select().from(invoices).where(
            and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at)),
        ).innerJoin(clients, eq(clients.id, invoices.createdFor))

        if (!invoice) return

        const itemsValues = await db.select().from(items).where(and(eq(items.invoiceId, invoiceId)))
    
        return { invoice: { ...invoice.invoices, items: itemsValues }, client: invoice.clients }
    }

    async getAll(userId: number) {
        const invoicesData = await db.select().from(invoices).where(
            and(eq(invoices.createdBy, userId), isNull(invoices.deleted_at))
        )
    
        return invoicesData
    }

    async update(invoiceId: number, userId: number, updateObj: UpdateInvoiceInput) {
        const [invoice] = await db.update(invoices).set({ ...updateObj, updated_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at))).returning()

        return invoice
    }

    async delete(invoiceId: number, userId: number) {
        const [invoice] = await db.update(invoices).set({ deleted_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId), isNull(invoices.deleted_at))).returning()
        
        // cancel associated reminders
        await db.update(reminders).set({ canceled: true }).where(and(eq(reminders.invoiceId, invoiceId), eq(reminders.userId, userId)))

        return invoice
    }
}

export default new InvoiceService()