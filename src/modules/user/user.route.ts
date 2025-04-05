import { FastifyInstance } from 'fastify'
import { loginUserHandler, logoutHandler, refreshTokenHandler, registerUserHandler, resendOTPHandler, resetPasswordHandler, resetPasswordRequestHandler, updateUserHandler, verifyOtpHandler } from './user.controller'
import { $ref } from './user.schema'
import { $errorRef } from '../../errors/schema-base'

async function userRoutes(server: FastifyInstance) {
    
    server.post(
        '/register',
        { 
            schema: { 
                body: $ref('createUserSchema'), 
                response: {
                    201: $ref('createUserResponseSchema'),
                    400: $errorRef('errorSchema'),
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
                    200: $ref('loginResponseSchema'),
                    400: $errorRef('errorSchema'),
                    401: $errorRef('errorSchema')
                }
            }
        },
        loginUserHandler
    )

    server.get(
        '/logout',
        logoutHandler
    )

    server.post(
        '/refresh',
        {
            schema: {
                response: {
                    200: $ref('refreshTokenResponse'),
                    401: $errorRef('errorSchema'),
                    403: $errorRef('errorSchema')
                }
            }
        },
        refreshTokenHandler
    )

    server.post(
        '/verify-otp',
        {
            schema: {
                body: $ref('verifyOTPSchema'),
                response: {
                    200: $ref('verifyOTPResponse'),
                    400: $errorRef('errorSchema'),
                    403: $errorRef('errorSchema')
                }
            }
        },
        verifyOtpHandler
    )

    server.post(
        '/resend-otp',
        {
            schema: {
                body: $ref('resendOTPSchema'),
                response: {
                    200: $ref('resendOTPResponse'),
                    404: $errorRef('errorSchema'),
                }
            }
        },
        resendOTPHandler
    )

    server.post(
        '/reset-password-request',
        {
            schema: {
                body: $ref('resetPasswordRequestSchema'),
                response: {
                    200: $ref('resetPasswordRequestResponse'),
                    400: $errorRef('errorSchema'),
                    404: $errorRef('errorSchema')
                }
            }
        },
        resetPasswordRequestHandler
    )

    server.post(
        '/reset-password',
        {
            schema: {
                body: $ref('resetPasswordSchema'),
                response: {
                    200: $ref('genericResponse'),
                    404: $errorRef('errorSchema'),
                }
            }
        },
        resetPasswordHandler
    )

    server.patch(
        '/update',
        {
            schema: {
                body: $ref('updateUserSchema'),
                response: {
                    200: $ref('updateUserResponse'),
                    409: $errorRef('errorSchema'),
                }
            }
        },
        updateUserHandler
    )
}

export default userRoutes