import { eq, and } from 'drizzle-orm'
import db from '../../db'
import { CreateClientInput } from './client.schema'
import clients from '../../db/schema/clients'

class ClientService {

    constructor() {}

    async create(data: CreateClientInput & { createdBy: number }) {
        const updatedData = {
            firstName: data.first_name,
            lastName: data.last_name,
            phoneNumber: data.phone_number,
            email: data.email
        }

        const client = await db.insert(clients).values({ ...updatedData }).returning()
    
        return client[0]
    }

    async update(clientId: number, userId: number, updateObj: any) {
        const updatedData = {
            firstName: updateObj.first_name,
            lastName: updateObj.last_name,
            phoneNumber: updateObj.phone_number,
            email: updateObj.email
        }

        const client = await db.update(clients).set(updatedData).where(and(eq(clients.id, clientId), eq(clients.createdBy, userId))).returning()

        return client[0]
    }

    async get(clientId: number, createdBy: number) {
        const client = db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.createdBy, createdBy)) })
    
        return client
    }

    async getClients(createdBy: number) {
        const client = db.query.clients.findMany({ where: eq(clients.createdBy, createdBy) })
    
        return client
    }

    async delete(clientId: number, createdBy: number) {
        const client = db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.createdBy, createdBy))).returning()
    
        return client
    }
}

export default new ClientService()