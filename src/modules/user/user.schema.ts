import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const userCore = {
    email: z.string({ 
        required_error: 'email is required', 
        invalid_type_error: 'email must be a string' 
    }).email(),
    firstName: z.string(),
    lastName: z.string(),
}

const createUserSchema = z.object({
    ...userCore,
    password: z.string({
        required_error: 'password is required', 
        invalid_type_error: 'password must be a string'
    })
})

const createUserResponseSchema = z.object({
    ...userCore,
    id: z.number()
})


export type CreateUserInput = z.infer<typeof createUserSchema>

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
    createUserSchema,
    createUserResponseSchema,
})