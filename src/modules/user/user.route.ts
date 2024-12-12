import { FastifyInstance } from 'fastify'
import { registerUserHandler } from './user.controller'
import { $ref } from './user.schema'
import { $errorRef } from '../errors/schema-base'

async function userRoutes(server: FastifyInstance) {
    
    server.post(
        '/',
        { 
            schema: { 
                body: $ref('createUserSchema'), 
                response: {
                    201: $ref('createUserResponseSchema'),
                    409: $errorRef('errorSchema')
                }
            } 
        }, 
        registerUserHandler
    )
}

export default userRoutes