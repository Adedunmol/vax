import { eq, and, isNull } from 'drizzle-orm'
import db from '../../db'
import { CreateExpenseInput, UpdateExpenseInput } from './expenses.schema'
import expenses from '../../db/schema/expenses'

class ExpensesService {

    constructor() {}

    async create(data: CreateExpenseInput & { userId: number }) {
        const { expense_date: expenseDate, ...rest } = data

        const expense = await db.insert(expenses).values({ ...rest, expenseDate, amount: data.amount.toFixed(2) }).returning()
    
        return expense[0]
    }

    async get(expenseId: number, userId: number) {
        const expense = db.query.expenses.findFirst({ where: and(eq(expenses.id, expenseId), eq(expenses.userId, userId)) })
    
        return expense
    }

    async getAll(userId: number) {
        const expensesData = db.query.expenses.findMany({ where: and(eq(expenses.userId, userId), isNull(expenses.deleted_at)) })
    
        return expensesData
    }

    async update(expenseId: number, userId: number, updateObj: UpdateExpenseInput) {
        const expense = await db.update(expenses).set({ ...updateObj, amount: updateObj.amount?.toFixed(2) }).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId))).returning()

        return expense[0]
    }

    async delete(expenseId: number, userId: number) {
        const expense = db.update(expenses).set({ deleted_at: new Date() }).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId))).returning()
    
        return expense
    }
}

export default new ExpensesService()