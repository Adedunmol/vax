import { FastifyReply, FastifyRequest } from 'fastify'
import ClientService from './client.service'
import { CreateClientInput, UpdateClientInput } from './client.schema'

export async function createClientHandler(request: FastifyRequest<{ Body: CreateClientInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id
        
        const input = { 
            createdBy: userId, 
            ...request.body
        }

        const data = await ClientService.create(input)

        return reply.code(201).send({ message: 'Client created successfully', data })
    } catch (err: any) {
        if (err.code === '23505' && err.detail) {
            const match = err.detail.match(/\((.*?)\)=/)
            const column = match ? match[1] : 'Field'
            return reply.status(409).send({ error: `${column} already exists` })
        }
        
        return reply.code(500).send(err)
    }
}

export async function getClientHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const client = await ClientService.get(request.params.clientId, userId)

        if (!client) return reply.code(404).send({ message: 'No client found with the id' })

        return reply.code(200).send({ message: "Client retrieved successfully", data: { ...client } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllClientsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const clients = await ClientService.getAll(userId)

        return reply.code(200).send({ message: "Clients retrieved successfully", data: { clients } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getClientInvoicesHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const invoices = await ClientService.getInvoices(request.params.clientId, userId)

        return reply.code(200).send({ message: "Invoices retrieved successfully", data: { invoices } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updateClientHandler(request: FastifyRequest<{ Body: UpdateClientInput, Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const client = await ClientService.update(request.params.clientId, userId, request.body)

        return reply.code(200).send({ message: "Client updated successfully", data: { ...client } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteClientHandler(request: FastifyRequest<{ Params: { clientId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.clientId) return reply.code(400).send({ message: 'clientId is required' })

        const userId = request.user.id

        const client = await ClientService.delete(request.params.clientId, userId)

        return reply.code(200).send({ message: "Client deleted successfully", data: { ...client } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}