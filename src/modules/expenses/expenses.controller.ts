import { FastifyReply, FastifyRequest } from 'fastify'
import ExpenseService from './expenses.service'
import { CreateExpenseInput, UpdateExpenseInput } from './expenses.schema'
import { logger } from '../../utils/logger'
import moment from 'moment'

export async function createExpenseHandler(request: FastifyRequest<{ Body: CreateExpenseInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!moment(request.body.expense_date).isValid()) return reply.code(400).send({ status: 'error', message: 'invalid expense_date passed' })
        
        const data = await ExpenseService.create({ ...request.body, userId, expense_date: moment(request.body.expense_date).toDate() })

        return reply.code(201).send({ status: 'success', message: 'Expense created successfully', data })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getExpenseHandler(request: FastifyRequest<{ Params: { expenseId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.expenseId) return reply.code(400).send({ status: 'error', message: 'expenseId is required' })

        const userId = request.user.id

        const expense = await ExpenseService.get(request.params.expenseId, userId)

        if (!expense) return reply.code(404).send({ message: 'No expense found with the id' })

        return reply.code(200).send({ status: 'success', message: "Expense retrieved successfully", data: expense })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function getAllExpensesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const expenses = await ExpenseService.getAll(userId)

        return reply.code(200).send({ status: 'success', message: "Expenses retrieved successfully", data: expenses })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function updateExpenseHandler(request: FastifyRequest<{ Body: UpdateExpenseInput, Params: { expenseId: number } }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        if (!request.params.expenseId) return reply.code(400).send({ status: 'error', message: 'expenseId is required' })
       
        const expense = await ExpenseService.update(request.params.expenseId, userId, request.body)

        return reply.code(200).send({ status: 'success', message: "Expense updated successfully", data: expense })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function deleteExpenseHandler(request: FastifyRequest<{ Params: { expenseId: number } }>, reply: FastifyReply) {
    try {
        if (!request.params.expenseId) return reply.code(400).send({ status: 'error', message: 'expenseId is required' })

        const userId = request.user.id

        const expense = await ExpenseService.delete(request.params.expenseId, userId)

        if (!expense) return reply.code(404).send({ status: 'success', message: 'No expense found with the id' })

        return reply.code(200).send({ status: 'success', message: "Expense deleted successfully", data: expense })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}