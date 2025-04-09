import { FastifyReply, FastifyRequest } from 'fastify'
import SettingsService from './settings.service'
import { UpdateSettingsInput } from './settings.schema'

export async function updateSettingsHandler(request: FastifyRequest<{ Body: UpdateSettingsInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const settings = await SettingsService.update(userId, request.body)

        return reply.code(200).send({ message: "User updated successfully", data: settings })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const settings = await SettingsService.get(userId)

        return reply.code(200).send({ message: "User retrieved successfully", data: settings })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}