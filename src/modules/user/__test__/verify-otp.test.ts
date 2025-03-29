import { test } from 'tap';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import UserService from '../user.service';
import build from '../../../app';

const fastify = build();

const endpoint = '/auth/verify-otp';

const validUserId = faker.number.int(100);
const validOTP = '123456';
const expiredOTPRecord = [{ otp: 'hashedOTP', expiresAt: Date.now() - 1000 }];
const validOTPRecord = [{ otp: 'hashedOTP', expiresAt: Date.now() + 60000 }];
const verifiedUser = { id: validUserId, verified: true };


test('should verify OTP successfully', async (t) => {
    
    t.teardown(() => {
        fastify.close();
    });

    ImportMock.mockFunction(UserService, 'findUserWithOtp', validOTPRecord);
    ImportMock.mockFunction(UserService, 'compareOtp', true);
    ImportMock.mockFunction(UserService, 'update', verifiedUser);
    ImportMock.mockFunction(UserService, 'deleteUserOtp');

    const response = await fastify.inject({
        method: 'POST',
        url: endpoint,
        payload: { userId: validUserId, otp: validOTP },
    });

    t.equal(response.statusCode, 200);
    t.same(JSON.parse(response.body), {
        status: 'verified',
        message: 'User email verified successfully',
        data: { id: validUserId },
    });
});

test('should return error if OTP is expired', async (t) => {
    
    t.teardown(() => {
        fastify.close();
    });

    ImportMock.mockFunction(UserService, 'findUserWithOtp', expiredOTPRecord);
    ImportMock.mockFunction(UserService, 'deleteUserOtp');

    const response = await fastify.inject({
        method: 'POST',
        url: endpoint,
        payload: { userId: validUserId, otp: validOTP },
    });

    t.equal(response.statusCode, 400);
    t.same(JSON.parse(response.body), { message: 'Code has expired. Please request again.' });
});

test('should return error if OTP is invalid', async (t) => {
    
    t.teardown(() => {
        fastify.close();
    });

    ImportMock.mockFunction(UserService, 'findUserWithOtp', validOTPRecord);
    ImportMock.mockFunction(UserService, 'compareOtp', false);

    const response = await fastify.inject({
        method: 'POST',
        url: endpoint,
        payload: { userId: validUserId, otp: validOTP },
    });

    t.equal(response.statusCode, 400);
    t.same(JSON.parse(response.body), { message: 'Invalid code passed. Check your inbox.' });
});

test("should return error if user's account does not exist or is already verified", async (t) => {
    
    t.teardown(() => {
        fastify.close();
    });
    
    ImportMock.mockFunction(UserService, 'findUserWithOtp', []);

    const response = await fastify.inject({
        method: 'POST',
        url: endpoint,
        payload: { userId: validUserId, otp: validOTP },
    });

    t.equal(response.statusCode, 403);
    t.same(JSON.parse(response.body), {
        message: "Account record doesn't exist or has been verified already. Please sign up or log in."
    });
});

test('should return 500 if an internal error occurs', async (t) => {
    
    t.teardown(() => {
        fastify.close();
    });

    ImportMock.mockFunction(UserService, 'findUserWithOtp').throws(new Error('Internal server error'));

    const response = await fastify.inject({
        method: 'POST',
        url: endpoint,
        payload: { userId: validUserId, otp: validOTP },
    });

    t.equal(response.statusCode, 500);
});
