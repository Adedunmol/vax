import { eq } from 'drizzle-orm'
import db from '../../db'
import { profiles, users } from '../../db/schema'
import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'
import { Profile } from '../../types/user'

class UserService {
    OTP_EXPIRATION: number

    constructor() {
        this.OTP_EXPIRATION = 3600000
    }

    async createUser(input: CreateUserInput) {
        const password = await this.hashPassword(input.password)
    
        const user = await db.insert(users).values({ ...input, password }).returning({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, username: users.username })
    
        return user[0]
    }

    async findUserByEmail(email: string) {
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

    async findUserById(id: number) {
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

    async updateUser(userId: number, updateUserObj: any) {

        const user = await db.update(users).set(updateUserObj).where(eq(users.id, userId)).returning()

        return user[0]
    }

    async updateUserprofile(updateObj: Profile) {
        const { userId, ...rest } = updateObj
        const profile = await db.update(profiles).set(rest).where(eq(profiles.userId, userId)).returning()
    }

    async generateOTP(id: number, email: string) {

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    
        const hashedOTP = await bcrypt.hash(otp, 10)
    
        const expiresAt = Date.now() + this.OTP_EXPIRATION
    
        // create an entry in the otp verification table
    
        return otp
    }

    async findUserWithToken(token: string) {
        const user = db.query.users.findFirst({where: eq(users.refreshToken, token)})
    
        return user
    }

    async findUserWithOtp(userId: number) {

        return []
    }

    async deleteUserOtp(userId: number) {

    }

    async compareOtp(candidateOtp: string, hashedOtp: string) {
        return bcrypt.compare(candidateOtp, hashedOtp)
    }

    async hashPassword(password: string) {
        return bcrypt.hash(password, 10)
    }
}

export default new UserService()