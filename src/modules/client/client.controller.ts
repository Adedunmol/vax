import { FastifyReply, FastifyRequest } from 'fastify'
import ClientService from './client.service'
import { CreateClientInput, UpdateClientInput } from './client.schema'
import { logger } from '../../utils/logger'

export async function createClientHandler(request: FastifyRequest<{ Body: CreateClientInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id
        
        const input = { 
            createdBy: userId, 
            ...request.body
        }

        const data = await ClientService.create(input)

        return reply.code(201).send({ status: 'success', message: 'Client created successfully', data })
    } catch (err: any) {
        if (err.code === '23505' && err.detail) {
            const match = err.detail.match(/\((.*?)\)=/)
            const column = match ? match[1] : 'Field'
            return reply.status(409).send({ status: "error", error: `${column} already exists` })
        }
        
        return reply.code(500).send(err)
    }
}

export async function getClientHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const cachedClient = await request.redis.get(`cache:clients:${request.params.clientId}`)

        if (cachedClient) return reply.code(200).send({ status: 'success', message: "Client retrieved successfully", data: JSON.parse(cachedClient) })

        const client = await ClientService.get(request.params.clientId, userId)

        if (!client) return reply.code(404).send({ message: 'No client found with the id' })

        await request.redis.set(`cache:clients:${request.params.clientId}`, JSON.stringify(client))

        return reply.code(200).send({ status: 'success', message: "Client retrieved successfully", data: client })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllClientsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const cachedClients = await request.redis.get(`cache:clients:${userId}`)

        if (cachedClients) return reply.code(200).send({ status: 'success', message: "Client retrieved successfully", data: JSON.parse(cachedClients) })

        const clients = await ClientService.getAll(userId)

        if (clients.length > 0) await request.redis.set(`cache:clients:${userId}`, JSON.stringify(clients))

        return reply.code(200).send({ status: 'success', message: "Clients retrieved successfully", data: clients })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getClientInvoicesHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const cachedInvoices = await request.redis.get(`cache:clients-invoices:${request.params.clientId}`)

        if (cachedInvoices) return reply.code(200).send({ status: 'success', message: "Invoices retrieved successfully", data: JSON.parse(cachedInvoices) })

        const invoices = await ClientService.getInvoices(request.params.clientId, userId)

        if (invoices.length > 0) await request.redis.set(`cache:clients-invoices:${request.params.clientId}`, JSON.stringify(invoices))

        return reply.code(200).send({ status: 'success', message: "Invoices retrieved successfully", data: invoices })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updateClientHandler(request: FastifyRequest<{ Body: UpdateClientInput, Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const client = await ClientService.update(request.params.clientId, userId, request.body)

        return reply.code(200).send({ status: 'success', message: "Client updated successfully", data: client })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteClientHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const client = await ClientService.delete(request.params.clientId, userId)

        return reply.code(200).send({ status: 'success', message: "Client deleted successfully", data: client })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}