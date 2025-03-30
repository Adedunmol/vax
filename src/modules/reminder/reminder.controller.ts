import { FastifyReply, FastifyRequest } from 'fastify'
import ReminderService from './reminder.service'
import { CreateReminderInput, UpdateReminderInput, createReminderSchema } from './reminder.schema'
import { ZodError } from 'zod'

export async function createReminder(data: CreateReminderInput) {
    try {
        const validData = createReminderSchema.parse(data)

        const result = await ReminderService.create(validData)

        return result
    } catch (err: any) {
        // handle if zod error
        if (err instanceof ZodError) {
            console.error(err.issues)
        }

        console.error(err)
    }
}

export async function getReminderHandler(request: FastifyRequest<{ Params: { reminderId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.reminderId) return reply.code(400).send({ message: 'expenseId is required' })

        const userId = request.user.id

        const reminder = await ReminderService.get(request.params.reminderId, userId)

        if (!reminder) return reply.code(404).send({ message: 'No reminder found with the id' })

        return reply.code(200).send({ message: "Reminder retrieved successfully", data: { ...reminder } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllRemindersHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const reminders = await ReminderService.getAll(userId)

        return reply.code(200).send({ message: "Reminders retrieved successfully", data: { reminders } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updateReminderHandler(request: FastifyRequest<{ Body: UpdateReminderInput, Params: { reminderId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.reminderId) return reply.code(400).send({ message: 'reminderId is required' })
       
        const expense = await ReminderService.update(request.params.reminderId, userId, request.body)

        return reply.code(200).send({ message: "Reminder updated successfully", data: { ...expense } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteReminderHandler(request: FastifyRequest<{ Params: { reminderId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.reminderId) return reply.code(400).send({ message: 'reminderId is required' })

        const userId = request.user.id

        const expense = await ReminderService.delete(request.params.reminderId, userId)

        return reply.code(200).send({ message: "Reminder deleted successfully", data: { ...expense } })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}