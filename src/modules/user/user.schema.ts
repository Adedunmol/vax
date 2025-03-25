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

const verifyOTPSchema = z.object({
    userId: z.number({ required_error: 'userId is required' }),
    otp: z.string({ required_error: 'otp is required' })
})

const resendOTPSchema = z.object({
    userId: z.number({ required_error: "userId is required" }),
    email: z.string({ required_error: "email is required" })
})

const resetPasswordRequestSchema = z.object({
    email: z.string({ required_error: "email is required" })
})

const resetPasswordSchema = z.object({
        email: z.string({ required_error: "email is required" }),
        otp: z.string({ required_error: "otp is required" }),
        password: z.string({ required_error: "password is required" }).min(6, "Password too short - should be 6 chars minimum"),
        passwordConfirmation: z.string({ required_error: "passwordConfirmation is required" }),
    }).refine((data) => data.password === data.passwordConfirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"]
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginUserInput = z.infer<typeof loginSchema>
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>
export type ResendOTPInput = z.infer<typeof resendOTPSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema,
    verifyOTPSchema,
    resendOTPSchema,
    resetPasswordRequestSchema,
    resetPasswordSchema
}, { '$id': 'UserSchema' })