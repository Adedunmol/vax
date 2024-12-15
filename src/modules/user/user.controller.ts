import { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import { createUser, findUserByEmail, generateOTP } from './user.service'
import { CreateUserInput, LoginUserInput } from './user.schema'
import { server } from '../..'
import { sendToQueue } from '../../queues'

export async function registerUserHandler(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await createUser(body)

        const otp = await generateOTP(user.id, user.email)

        const emailData = {
            template: 'verification',
            locals: { firstName: user.firstName, otp },
            to: user.email
        }
    
        await sendToQueue('emails', emailData)

        return reply.code(201).send(user)
    } catch (err) {
        server.log.error(err)

        // check source of error
        return reply.code(500).send(err)
    }
}

export async function loginUserHandler(request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        // find user by email
        const user = await findUserByEmail(body.email)

        // return error if no user is found
        if (!user) return reply.code(401).send('invalid credentials')

        // verify password
        const match = await bcrypt.compare(body.password, user.password)

        // return error if password is incorrect
        if (!match) return reply.code(401).send('invalid credentials')

        // update user's last login

        // generate access token
        // { accessToken: server.jwt.sign(user) }

    } catch (err) {
        server.log.error(err)

        // check source of error
        return reply.code(500).send(err)
    }
}