import { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import UserService from './user.service'
import { CreateUserInput, LoginUserInput, ResendOTPInput, ResetPasswordInput, ResetPasswordRequestInput, UpdateUserInput, VerifyOTPInput } from './user.schema'
import { sendToQueue } from '../../queues'
import moment from 'moment'
import { logger } from '../../utils/logger'
import { FastifyJWT } from '@fastify/jwt'

export async function registerUserHandler(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await UserService.create(body)

        const otp = await UserService.generateOTP(user.id, user.email)

        const emailData = {
            template: 'verification',
            locals: { firstName: user.firstName, otp },
            to: user.email
        }
    
        await sendToQueue('emails', emailData)

        await UserService.createProfile(user.id)

        const { firstName: first_name, lastName: last_name } = user

        return reply.code(201).send({ status: 'success', message: 'User created successfully', data: { ...user, first_name, last_name } })
    } catch (err: any) {
        if (err.code === '23505' && err.detail) {
            const match = err.detail.match(/\((.*?)\)=/)
            const column = match ? match[1] : 'Field'
            return reply.status(409).send({ status: 'conflict error', message: `${column} already exists` })
        }
    
        return reply.code(500).send(err)
    }
}

export async function loginUserHandler(request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await UserService.findByEmail(body.email)

        if (!user.users) return reply.code(401).send({ status: 'error', message: 'invalid credentials' })

        const match = await UserService.comparePassword(body.password, user.users.password)

        if (!match) return reply.code(401).send({ status: 'error', message: 'invalid credentials' })

        // update user's last login
        await UserService.updateProfile({ userId: user.users.id, lastLogin: new Date() })

        const refreshToken = request.jwt.sign({ id: user.users.id, email: user.users.email })

        await UserService.update(user.users.id, { refreshToken })

        reply.setCookie('jwt', refreshToken, { httpOnly: true, maxAge: 15 * 60 * 1000, sameSite: 'none' })
        return reply.code(200).send({ status: 'success', message: 'User logged in succesfully', data: { access_token: request.jwt.sign({ id: user.users.id, email: user.users.email }) } })
    } catch (err) {
        // server.log.error(err)

        return reply.code(401).send(err)
    }
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const refreshToken = request.cookies.jwt;

        if (!refreshToken) return reply.code(204).send()

        const foundUser = await UserService.findUserWithToken(refreshToken)

        if (!foundUser) {
            reply.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60, sameSite: 'none' })
            return reply.code(204).send()
        }

        await UserService.update(foundUser.id, { refreshToken: '' })

        await UserService.updateProfile({ userId: foundUser.id, lastLogin: new Date() })

        reply.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'none'})

        return reply.code(204).send()
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}

export async function refreshTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const cookie = request.cookies
        
        if (!cookie?.jwt) {
            return reply.code(401).send({ status: 'error', message: 'You are not authorized to access this route' })
        }
        //reuse detected
        const refreshToken = cookie.jwt;
        reply.clearCookie('jwt', {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'none',
        });
    
        const user = await UserService.findUserWithToken(refreshToken);
    
        // Token reuse detected
        if (!user) {
            try {
                const decoded = request.jwt.verify<FastifyJWT['user']>(refreshToken);
                const reusedUser = await UserService.findByEmail(decoded?.email);
    
                if (reusedUser) {
                    await UserService.update(decoded.id, { refreshToken: '' });
                }
            } catch (err) {
                return reply.code(403).send({ status: 'error', message: 'Bad token for reuse' });
            }
    
            return reply.code(401).send({ status: 'error', message: 'Token reuse' });
        }


        let decoded;
        try {
            decoded = await request.jwt.verify(refreshToken);
        } catch (err) {
            await UserService.update(user.id, { refreshToken: '' });
            return reply.code(403).send({ status: 'error', message: 'Bad token' });
        }
    
        if (decoded.email !== user.email) {
            return reply.code(403).send({ status: 'error', message: 'Bad token' });
        }
    
        const accessToken = request.jwt.sign({ id: user.id, email: user.email });
        const newRefreshToken = request.jwt.sign({ id: user.id, email: user.email });
    
        await UserService.update(user.id, { refreshToken: newRefreshToken });

        await UserService.updateProfile({ userId: user.id, lastLogin: new Date() })
    
        reply.setCookie('jwt', newRefreshToken, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'none',
        });
    
        return reply.code(200).send({
            status: 'success',
            message: 'Access token refreshed successfully',
            data: { access_token: accessToken },
        });
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function verifyOtpHandler(request: FastifyRequest<{ Body: VerifyOTPInput }>, reply: FastifyReply) {
    try {
        const userOTPRecord = await UserService.findUserWithOtp(request.body.userId)

        if (!userOTPRecord) {
            return reply.code(403).send({ status: 'error', message: "Account record doesn't exist or has been verified already. Please sign up or log in." })
        }
    
        // user otp record exists
        const { expiresAt } = userOTPRecord
        const hashedOTP = userOTPRecord.otp

        if (moment(expiresAt).isBefore(new Date())) {
            await UserService.deleteUserOtp(request.body.userId)
            return reply.code(400).send({ status: 'error', message: 'Code has expired. Please request again.' })
        }
    
        const validOTP = await UserService.compareOtp(request.body.otp, hashedOTP)
    
        if (!validOTP) {
            return reply.code(400).send({ status: 'error', message: 'Invalid code passed. Check your inbox.' })
        }
    
        const user = await UserService.update(request.body.userId, { verified: true })
    
        await UserService.deleteUserOtp(request.body.userId)
        
        return reply.code(200).send({ status: "verified", message: "User email verified successfully", data: { id: user.id } })
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function resendOTPHandler(request: FastifyRequest<{ Body: ResendOTPInput }>, reply: FastifyReply) {
    try {
        await UserService.deleteUserOtp(request.body.userId)

        const user = await UserService.findById(request.body.userId)
    
        if (!user) return reply.code(404).send({ status: 'error', message: 'No user found with this id' })
    
        const otp = await UserService.generateOTP(user.users.id, user.users.email)
        
        const emailData = {
            template: "verification",
            locals: { username: user.users.username, otp },
            to: user.users.email
        }
        await sendToQueue('emails', emailData) // send verification mail to user
    
        return reply.code(200).send({ status: "pending", message: "Verification OTP email sent", data: { userId: request.body.userId, email: request.body.email } })
    } catch(err) {
        return reply.code(500).send(err)
    }
}

export async function resetPasswordRequestHandler(request: FastifyRequest<{ Body: ResetPasswordRequestInput }>, reply: FastifyReply) {
    try {
        const user = await UserService.findByEmail(request.body.email.trim())

        if (!user) return reply.code(404).send({ status: 'error', message: 'No user found with this email' })
    
        if (!user.users.verified) return reply.code(400).send({ status: 'error', message: "Email hasn't been verified yet. Check your inbox." })
    
        const otpDetails = {
            email: request.body.email.trim(),
            _id: user.users.id
        }
    
        await UserService.deleteUserOtp(user.users.id)
    
        const otp = await UserService.generateOTP(user.users.id, user.users.email)
        
        const emailData = {
            template: "forgot-password",
            locals: { otp },
            to: user.users.email
        }
        await sendToQueue('emails', emailData) // send verification mail to user
    
        return reply.code(200).send({ status: "success", message: "otp has been sent to the provided email", data: { userId: user.users.id, email: user.users.email, otp } }) // userOTPVerification.otp
    } catch (err) {
        return reply.code(500).send(err)
    }
}

export async function resetPasswordHandler(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
    try {
        const user = await UserService.findByEmail(request.body.email.trim())

        if (!user) return reply.code(404).send({ status: 'error', message: 'No user found with this email' })
    
        const userOTPRecord = await UserService.findUserWithOtp(user.users.id)
    
        if (!userOTPRecord) {
            return reply.code(400).send({ status: 'error', message: 'Password reset request has not been made.' })
        }
    
        // user otp record exists
        const { expiresAt } = userOTPRecord
        const hashedOTP = userOTPRecord.otp
    
        if (moment(expiresAt).isBefore(new Date())) {
            await UserService.deleteUserOtp(user.users.id)
            return reply.code(400).send({ status: 'error', message: 'Code has expired. Please request again.' })
        }
    
        const validOTP = await bcrypt.compare(request.body.otp.trim(), hashedOTP)
    
        if (!validOTP) {
            return reply.code(400).send({ status: 'error', message: 'Invalid code passed. Check your inbox.' })
        }
    
        const hashedPassword = await UserService.hashPassword(request.body.password.trim())
    
        await UserService.update(user.users.id, { password: hashedPassword })
    
        await UserService.deleteUserOtp(user.users.id)
    
        return reply.status(200).send({ status: "success", message: "Password changed successfully", data: null })
    } catch (err) {
        return reply.code(500).send(err)
    }
}

export async function updateUserHandler(request: FastifyRequest<{ Body: UpdateUserInput }>, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const user = await UserService.update(userId, request.body)

        return reply.code(200).send({ status: 'success', message: "User updated successfully", data: { ...user } })
    } catch (err: any) {
        if (err.code === '23505' && err.detail) {
            const match = err.detail.match(/\((.*?)\)=/)
            const column = match ? match[1] : 'Field'
            return reply.status(409).send({ status: 'conflict error', message: `${column} already exists` })
        }
    
        return reply.code(500).send(err)
    }
}