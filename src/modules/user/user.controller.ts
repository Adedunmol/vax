import { FastifyReply, FastifyRequest } from "fastify";
import { createUser } from "./user.service";
import { CreateUserInput } from "./user.schema";

export async function registerUserHandler(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const body = request.body

    try {
        const user = await createUser(body)

        // send mail to user

        return reply.code(201).send(user)
    } catch (err) {
        console.error(err)

        // check source of error
        return reply.code(500).send(err)
    }
}