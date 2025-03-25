import { eq } from 'drizzle-orm'
import db from '../../db'
import { CreatePaymentInput } from './payment.schema'

class PaymentService {

    constructor() {
    }

    async create(data: CreatePaymentInput) {
        // create payment entry

        // update the amount_paid in invoice and if the amount_paid == total_amount, set status to paid
    }

    async update(paymentId: number, updateObj: any) {

        // if the amount field is being modified, update the amount_paid
    }
}

export default new PaymentService()