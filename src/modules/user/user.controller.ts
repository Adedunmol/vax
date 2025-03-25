import { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import UserService from './user.service'
import { CreateUserInput, LoginUserInput, ResendOTPInput, ResetPasswordInput, ResetPasswordRequestInput, VerifyOTPInput } from './user.schema'
import { sendToQueue } from '../../queues'

export async function registerUserHandler(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await UserService.createUser(body)

        const otp = await UserService.generateOTP(user.id, user.email)

        const emailData = {
            template: 'verification',
            locals: { firstName: user.firstName, otp },
            to: user.email
        }
    
        await sendToQueue('emails', emailData)

        return reply.code(201).send(user)
    } catch (err: any) {
        // check source of error
        if (err.code === '23505' && err.detail) {
            const match = err.detail.match(/\((.*?)\)=/)
            const column = match ? match[1] : 'Field'
            return reply.status(409).send({ error: `${column} already exists` })
        }
    
        return reply.code(500).send(err)
    }
}

export async function loginUserHandler(request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await UserService.findUserByEmail(body.email)

        if (!user) return reply.code(401).send('invalid credentials')

        const match = await bcrypt.compare(body.password, user.password)

        if (!match) return reply.code(401).send('invalid credentials')

        // update user's last login
        await UserService.updateUserprofile({ userId: user.id, lastLogin: new Date() })

        const refreshToken = request.jwt.sign({ id: user.id, email: user.email })

        await UserService.updateUser({ refreshToken })

        reply.setCookie('jwt', refreshToken, { httpOnly: true, maxAge: 15 * 60 * 1000, sameSite: 'none' })
        return { accessToken: request.jwt.sign({ id: user.id, email: user.email }) }
    } catch (err) {
        // server.log.error(err)

        return reply.code(401).send(err)
    }
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const refreshToken = request.cookies.jwt;

        if (!refreshToken) return reply.code(204)

        const foundUser = await UserService.findUserWithToken(refreshToken)

        if (!foundUser) {
            reply.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60, sameSite: 'none' })
            return reply.code(204)
        }

        await UserService.updateUser({ userId: foundUser.id, refreshToken: '' })

        reply.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none'})

        return reply.code(204)
    } catch (err: any) {
        return reply.code(500)
    }
}

export async function refreshTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const cookie = request.cookies
    
        if (!cookie?.jwt) {
            return reply.code(401).send({ message: 'You are not authorized to access this route' })
        }

        const refreshToken = cookie.jwt
        reply.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none'})

        const user = await UserService.findUserWithToken(refreshToken)

        //reuse detected
        if (!user) {
            request.jwt.verify(
                refreshToken,
                async (err, data) => {
                    if (err) {
                        return reply.code(403).send({ message: 'bad token for reuse' })
                    }
                    const user = await UserService.findUserByEmail(data?.email)
                
                    if (user) {
                        await UserService.updateUser({ userId: data?.id, refreshToken: '' })
                    }
                }
            )

            return reply.code(401).send({ message: 'Token reuse' })
        }

        request.jwt.verify(
            refreshToken,
            async (err, data) => {
                if (err) {
                    await UserService.updateUser({ userId: data?.id, refreshToken: '' })
                }
                if (err || data?.email !== user.email) {
                    return reply.code(403).send({ message: 'bad token' })
                }

                const accessToken = request.jwt.sign({ id: user.id, email: user.email })

                const newRefreshToken = request.jwt.sign({ id: user.id, email: user.email })
            
                await UserService.updateUser({ userId: data?.id, refreshToken: '' })

                reply.cookie('jwt', newRefreshToken, {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none'})

                return reply.code(200).send({ status: 'success', message: '', data: { accessToken, expiresIn: 15 * 60 * 1000 }})
            }
        )
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function verifyOtpHandler(request: FastifyRequest<{ Body: VerifyOTPInput }>, reply: FastifyReply) {
    try {
        const userOTPRecords = await UserService.findUserWithOtp(request.body.userId)

        if (userOTPRecords.length <= 0) {
            return reply.code(403).send({ message: "Account record doesn't exist or has been verified already. Please sign up or log in." })
        }
    
        // user otp record exists
        const { expiresAt } = userOTPRecords[0]
        const hashedOTP = userOTPRecords[0] //.otp
    
        if (expiresAt < Date.now()) {
            await UserService.deleteUserOtp(request.body.userId)
            return reply.code(400).send({ message: 'Code has expired. Please request again.' })
        }
    
        const validOTP = await UserService.compareOtp(request.body.otp, hashedOTP)
    
        if (!validOTP) {
            return reply.code(400).send({ message: 'Invalid code passed. Check your inbox.' })
        }
    
        const user = await UserService.updateUser({ userId: request.body.userId, verfied: true })
    
        await UserService.deleteUserOtp(request.body.userId)
        
        return reply.code(200).send({ status: "verified", message: "User email verified successfully", data: { id: user.id } })
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function resendOTPHandler(request: FastifyRequest<{ Body: ResendOTPInput }>, reply: FastifyReply) {
    try {
        await UserService.deleteUserOtp(request.body.userId)

        const user = await UserService.findUserById(request.body.userId)
    
        if (!user) return reply.code(404).send({ message: 'No user found with this id' })
    
        const otp = await UserService.generateOTP(user.id, user.email)
        
        const emailData = {
            template: "verification",
            locals: { username: user.username, otp },
            to: user.email
        }
        await sendToQueue('emails', emailData) // send verification mail to user
    
        return reply.code(200).send({ status: "pending", message: "Verification OTP email sent", data: { userId: request.body.userId, email: request.body.email } })
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function resetPasswordRequestHandler(request: FastifyRequest<{ Body: ResetPasswordRequestInput }>, reply: FastifyReply) {
    try {
        const user = await UserService.findUserByEmail(request.body.email.trim())

        if (!user) return reply.code(404).send({ message: 'No user found with this email' })
    
        if (!user.verified) return reply.code(400).send({ message: "Email hasn't been verified yet. Check your inbox." })
    
        const otpDetails = {
            email: request.body.email.trim(),
            _id: user.id
        }
    
        await UserService.deleteUserOtp(user.id)
    
        const otp = await UserService.generateOTP(user.id, user.email)
        
        const emailData = {
            template: "forgot-password",
            locals: { otp },
            to: user.email
        }
        await sendToQueue('emails', emailData) // send verification mail to user
    
        return reply.code(200).send({ status: "success", message: "otp has been sent to the provided email", data: { userId: user.id, email: user.email, otp: '1234' } }) // userOTPVerification.otp
    } catch (err) {
        return reply.code(500).send(err)
    }
}

export async function resetPasswordController(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
    try {
        const user = await UserService.findUserByEmail(request.body.email.trim())

        if (!user) return reply.code(404).send({ message: 'No user found with this email' })
    
        const userOTPRecords = await UserService.findUserWithOtp(user.id)
    
        if (userOTPRecords.length <= 0) {
            return reply.code(400).send({ message: 'Password reset request has not been made.' })
        }
    
        // user otp record exists
        const { expiresAt } = userOTPRecords[0]
        const hashedOTP = userOTPRecords[0] // .otp
    
        if (expiresAt < Date.now()) {
            await UserService.deleteUserOtp(user.id)
            return reply.code(400).send({ message: 'Code has expired. Please request again.' })
        }
    
        const validOTP = await bcrypt.compare(request.body.otp.trim(), hashedOTP)
    
        if (!validOTP) {
            return reply.code(400).send({ message: 'Invalid code passed. Check your inbox.' })
        }
    
        const hashedPassword = await UserService.hashPassword(request.body.password.trim())
    
        await UserService.updateUser({ userId: user.id, password: hashedPassword })
    
        await UserService.deleteUserOtp(user.id)
    
        return reply.status(200).send({ status: "success", message: "Password changed successfully", data: null })
    } catch (err) {
        return reply.code(500).send(err)
    }
}