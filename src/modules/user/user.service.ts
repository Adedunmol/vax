import { eq } from 'drizzle-orm'
import db from '../../db'
import { users } from '../../db/schema'
import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'
import { sendToQueue } from '../../queues'

export async function createUser(input: CreateUserInput) {
    const password = await bcrypt.hash(input.password, 10)

    const user = await db.insert(users).values({ ...input, password }).returning()

    return user[0]
}

export async function findUserByEmail(email: string) {
    // find and return user by email
    const user = await db.select().from(users).where(eq(users.email, email))

    return user[0]
}

const OTP_EXPIRATION = 3600000


export async function generateOTP(id: number, email: string) {

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const hashedOTP = await bcrypt.hash(otp, 10)

    const expiresAt = Date.now() + OTP_EXPIRATION

    // create an entry in the otp verification table

    return otp
}