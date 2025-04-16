import { eq, InferSelectModel } from 'drizzle-orm'
import db from '../../db'
import { profiles, userOtpVerifications, users } from '../../db/schema'
import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'
import { Profile } from '../../types/user'
import moment from 'moment'

type UserDetails = Partial<InferSelectModel<typeof users>>

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
        const [user] = await db.select().from(users).where(eq(users.email, email)).leftJoin(profiles, eq(users.id, profiles.userId))
    
        return user
    }

    async findById(id: number) {
        // find and return user by email
        // const user = await db.select().from(users).where(eq(users.email, email))
        const [user] = await db.select().from(users).where(eq(users.id, id)).leftJoin(profiles, eq(users.id, profiles.userId))
    
        return user
    }

    async update(userId: number, updateUserObj: UserDetails) {

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
    
        const expiresAt = moment(Date.now()).add(30, 'minutes').toDate()

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
            where: eq(userOtpVerifications.userId, userId)
        });

        return otpRecord
    }

    async deleteUserOtp(userId: number) {
        await db.delete(userOtpVerifications).where(eq(userOtpVerifications.userId, userId))
    }

    async compareOtp(candidateOtp: string, hashedOtp: string) {
        return bcrypt.compare(candidateOtp, hashedOtp)
    }

    async comparePassword(candidatePassword: string, hashedPassword: string) {
        return bcrypt.compare(candidatePassword, hashedPassword)
    }

    async hashPassword(password: string) {
        return bcrypt.hash(password, 10)
    }

    async createProfile(userId: number) {
        const [profile] = await db.insert(profiles).values({ userId }).returning()
    
        return profile
    }
}

export default new UserService()