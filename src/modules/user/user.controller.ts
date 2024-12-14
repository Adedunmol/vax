import { FastifyReply, FastifyRequest } from "fastify";
import { createUser } from "./user.service";
import { CreateUserInput, LoginUserInput } from "./user.schema";
import { server } from "../..";

export async function registerUserHandler(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await createUser(body)

        // add user mail details to queue

        // send mail to user

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

        // return error if no user is found

        // verify password

        // return error if password is incorrect

        // update user's last login

        // generate access token
        // { accessToken: server.jwt.sign(user) }

    } catch (err) {
        server.log.error(err)

        // check source of error
        return reply.code(500).send(err)
    }
}