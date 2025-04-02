import { eq, and, desc, sql } from 'drizzle-orm'
import db from '../../db'
import { profiles, userOtpVerifications, users } from '../../db/schema'
import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'
import { Profile } from '../../types/user'

const OTP_EXPIRATION = 3600000

class UserService {

    async create(input: Omit<CreateUserInput, 'password_confirmation'>) {
        const password = await this.hashPassword(input.password)
        const { first_name: firstName, last_name: lastName } = input

        const [user] = await db.insert(users).values({ ...input, firstName, lastName, password }).returning({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, username: users.username })
    
        return user
    }

    async findByEmail(email: string) {
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

    async findById(id: number) {
        // find and return user by email
        // const user = await db.select().from(users).where(eq(users.email, email))
        const user = db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                profiles: true
            }
        })
    
        return user
    }

    async update(userId: number, updateUserObj: any) {

        const [user] = await db.update(users).set({ ...updateUserObj, updated_at: new Date() }).where(eq(users.id, userId)).returning()

        return user
    }

    async updateProfile(updateObj: Profile) {
        const { userId, ...rest } = updateObj
        await db.update(profiles).set(rest).where(eq(profiles.userId, userId)).returning()
    }

    async generateOTP(id: number, email: string) {

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    
        const hashedOTP = await bcrypt.hash(otp, 10)
    
        const expiresAt = Date.now() + OTP_EXPIRATION

        await db.insert(userOtpVerifications).values({
            userId: id,
            otp: hashedOTP,
            expiresAt
        })
    
        return otp
    }

    async findUserWithToken(token: string) {
        const user = db.query.users.findFirst({where: eq(users.refreshToken, token)})
    
        return user
    }

    async findUserWithOtp(userId: number) {
        const otpRecord = await db.query.userOtpVerifications.findFirst({
            where: and(
                eq(userOtpVerifications.userId, userId),
            )
        });

        return otpRecord
    }

    async deleteUserOtp(userId: number) {
        await db.delete(userOtpVerifications).where(eq(userOtpVerifications.userId, userId))
    }

    async compareOtp(candidateOtp: string, hashedOtp: string) {
        return bcrypt.compare(candidateOtp, hashedOtp)
    }

    async hashPassword(password: string) {
        return bcrypt.hash(password, 10)
    }
}

export default new UserService()