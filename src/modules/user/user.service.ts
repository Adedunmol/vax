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
        const password = await bcrypt.hash(input.password, 10)
    
        const user = await db.insert(users).values({ ...input, password }).returning()
    
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
}

export default new UserService()