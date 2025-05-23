import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const userCore = {
    email: z.string({ 
        required_error: 'email is required', 
        invalid_type_error: 'email must be a string' 
    }).email(),
    first_name: z.string(),
    last_name: z.string(),
    username: z.string()
}

const createUserSchema = z.object({
    ...userCore,
    password: z.string({
        required_error: 'password is required', 
        invalid_type_error: 'password must be a string'
    }).min(6, 'password cannot be shorter than 6 characters'),
    password_confirmation: z.string({ required_error: 'password_confirmation is required' })
}).refine(data => data.password === data.password_confirmation, {
    message: 'passwords do not match',
    path: ['passwordConfirmation']
})

const createUserResponseSchema = z.object({
    ...responseCore,
    data: z.object({
        ...userCore,
        id: z.number()
    })
})

const loginSchema = z.object({
    email: z.string({ 
        required_error: 'email is required', 
        invalid_type_error: 'email must be a string' 
    }).email(),
    password: z.string()
})

const loginResponseSchema = z.object({
    ...responseCore,
    data: z.object({
        access_token: z.string(),
    })
})

const userResponse = z.object({
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    email: z.string(),
    verified: z.boolean(),
})

const genericResponse = z.object({
    ...responseCore
})

const updateUserResponse = z.object({
    ...responseCore,
    data: userResponse
})

const resetPasswordRequestResponse = z.object({
    ...responseCore,
    data: z.object({
        userId: z.number(),
        email: z.string(),
        otp: z.string()
    })
})

const resendOTPResponse = z.object({
    ...responseCore,
    data: z.object({
        userId: z.number(),
        email: z.string()
    })
})

const verifyOTPResponse = z.object({
    ...responseCore,
    data: z.object({
        id: z.number()
    })
})

const refreshTokenResponse = z.object({
    ...responseCore,
    data: z.object({
        access_token: z.string()
    })
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
        password_confirmation: z.string({ required_error: "passwordConfirmation is required" }),
    }).refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"]
})

export const updateUserSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    username: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginUserInput = z.infer<typeof loginSchema>
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>
export type ResendOTPInput = z.infer<typeof resendOTPSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema,
    verifyOTPSchema,
    resendOTPSchema,
    resetPasswordRequestSchema,
    resetPasswordSchema,
    updateUserSchema,
    updateUserResponse,
    genericResponse,
    resetPasswordRequestResponse,
    resendOTPResponse,
    verifyOTPResponse,
    refreshTokenResponse
}, { '$id': 'UserSchema' })