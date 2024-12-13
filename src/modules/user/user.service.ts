import { CreateUserInput } from './user.schema'
import bcrypt from 'bcrypt'

export async function createUser(input: CreateUserInput) {
    // create user

    // hash password

    // return user
}

export async function findUserByEmail(email: string) {
    // find and return user by email
}

const OTP_EXPIRATION = 3600000


export async function generateOTP(id: number, email: string) {

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const hashedOTP = await bcrypt.hash(otp, 10)

    // create an entry in the otp verification table

    return otp
}