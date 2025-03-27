import { eq, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoice.schema'
import invoices from '../../db/schema/invoices'


class InvoiceService {

    constructor() {}

    async create(data: CreateInvoiceInput & { userId: number }) {
        const { due_date: dueDate, ...rest } = data

        const invoice = await db.insert(invoices).values({ ...rest, dueDate, createdBy: data.userId, createdFor: data.client_id }).returning()
    
        return invoice[0]
    }

    async get(invoiceId: number, userId: number) {
        const invoice = db.query.invoices.findFirst({ 
            where: and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId)),
            with: {
                clients: true
            }
        })
    
        return invoice
    }

    async getAll(userId: number) {
        const invoicesData = db.query.invoices.findMany({ 
            where: and(eq(invoices.createdBy, userId), isNull(invoices.deleted_at)),
            with: {
                clients: true
            }
        })
    
        return invoicesData
    }

    async update(invoiceId: number, userId: number, updateObj: UpdateInvoiceInput) {
        const invoice = await db.update(invoices).set({ ...updateObj, updated_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId))).returning()

        return invoice[0]
    }

    async delete(invoiceId: number, userId: number) {
        const invoice = db.update(invoices).set({ deleted_at: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.createdBy, userId))).returning()
    
        return invoice
    }
}

export default new InvoiceService()