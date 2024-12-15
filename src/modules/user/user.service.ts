import { eq } from 'drizzle-orm'
import db from '../../db'
import { profiles, users } from '../../db/schema'
import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'
import { Profile } from '../../types/user'

export async function createUser(input: CreateUserInput) {
    const password = await bcrypt.hash(input.password, 10)

    const user = await db.insert(users).values({ ...input, password }).returning()

    return user[0]
}

export async function findUserByEmail(email: string) {
    // find and return user by email
    // const user = await db.select().from(users).where(eq(users.email, email))
    const user = db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
            profiles: true
        }
    })

    return user
}

export async function updateUserprofile(updateObj: Profile) {
    const { userId, ...rest } = updateObj
    const profile = await db.update(profiles).set(rest).where(eq(profiles.userId, userId)).returning()
}

const OTP_EXPIRATION = 3600000


export async function generateOTP(id: number, email: string) {

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const hashedOTP = await bcrypt.hash(otp, 10)

    const expiresAt = Date.now() + OTP_EXPIRATION

    // create an entry in the otp verification table

    return otp
}