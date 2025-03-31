import { eq, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreateClientInput, UpdateClientInput } from './client.schema'
import clients from '../../db/schema/clients'
import { invoices } from '../../db/schema'

class ClientService {

    constructor() {}

    async create(data: CreateClientInput & { createdBy: number }) {
        const updatedData = {
            firstName: data.first_name,
            lastName: data.last_name,
            phoneNumber: data.phone_number,
            email: data.email
        }

        const [client] = await db.insert(clients).values({ ...updatedData }).returning()
    
        return client
    }

    async update(clientId: number, userId: number, updateObj: UpdateClientInput) {
        const updatedData = {
            firstName: updateObj.first_name,
            lastName: updateObj.last_name,
            phoneNumber: updateObj.phone_number,
            email: updateObj.email
        }

        const [client] = await db.update(clients).set({ ...updatedData, updated_at: new Date() }).where(and(eq(clients.id, clientId), eq(clients.createdBy, userId))).returning()

        return client
    }

    async get(clientId: number, createdBy: number) {
        const client = db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.createdBy, createdBy)) })
    
        return client
    }

    async getAll(createdBy: number) {
        const client = db.query.clients.findMany({ where: and(eq(clients.createdBy, createdBy), isNull(clients.deleted_at)) })
    
        return client
    }

    async getInvoices(clientId: number, userId: number) {
        const invoicesData = db.query.invoices.findMany({ 
            where: and(
                eq(invoices.createdFor, clientId), 
                isNull(invoices.deleted_at),
                eq(invoices.createdBy, userId)
                ),
        })
    
        return invoicesData
    }

    async delete(clientId: number, createdBy: number) {
        const client = db.update(clients).set({ deleted_at: new Date() }).where(and(eq(clients.id, clientId), eq(clients.createdBy, createdBy))).returning()
    
        return client
    }
}

export default new ClientService()