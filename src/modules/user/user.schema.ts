import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const userCore = {
    email: z.string({ 
        required_error: 'email is required', 
        invalid_type_error: 'email must be a string' 
    }).email(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string()
}

const createUserSchema = z.object({
    ...userCore,
    password: z.string({
        required_error: 'password is required', 
        invalid_type_error: 'password must be a string'
    }).min(6, 'password cannot be shorter than 6 characters'),
    passwordConfirmation: z.string({ required_error: 'password confirmation is required' })
}).refine(data => data.password === data.passwordConfirmation, {
    message: 'passwords do not match',
    path: ['passwordConfirmation']
})

const createUserResponseSchema = z.object({
    ...userCore,
    id: z.number()
})

const loginSchema = z.object({
    email: z.string({ 
        required_error: 'email is required', 
        invalid_type_error: 'email must be a string' 
    }).email(),
    password: z.string()
})

const loginResponseSchema = z.object({
    accessToken: z.string(),
    expiresIn: z.number()
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginUserInput = z.infer<typeof loginSchema>

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema
}, { '$id': 'UserSchema' },)