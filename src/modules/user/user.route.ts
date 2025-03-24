import { FastifyInstance } from 'fastify'
import { loginUserHandler, registerUserHandler } from './user.controller'
import { $ref } from './user.schema'
import { $errorRef } from '../errors/schema-base'

async function userRoutes(server: FastifyInstance) {
    
    server.post(
        '/register',
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

    server.post(
        '/login',
        {
            schema: {
                body: $ref('loginSchema'),
                response: {
                    200: $ref('loginResponseSchema')
                }
            }
        },
        loginUserHandler
    )
}

export default userRoutes