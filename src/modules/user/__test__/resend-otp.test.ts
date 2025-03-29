import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';
import * as queue from '../../../queues';

const url = '/api/v1/users/resend-otp';

const userId = faker.number.int();
const email = faker.internet.email();
const username = faker.internet.userName();
const otp = faker.string.numeric(6);

const deleteUserOtpStub = ImportMock.mockFunction(userService, 'deleteUserOtp', {});
const findUserStub = ImportMock.mockFunction(userService, 'findById', { id: userId, email, username });
const generateOTPStub = ImportMock.mockFunction(userService, 'generateOTP', otp);
const sendToQueueStub = ImportMock.mockFunction(queue, 'sendToQueue', {});

test("✅ Should resend OTP successfully", async (t) => {
    const fastify = build();

    t.teardown(() => {
        fastify.close();
        deleteUserOtpStub.restore();
        findUserStub.restore();
        generateOTPStub.restore();
        sendToQueueStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { userId, email }
    });

    t.equal(response.statusCode, 200);
    t.same(response.json(), {
        status: "pending",
        message: "Verification OTP email sent",
        data: { userId, email }
    });
});

test("❌ Should return 404 if user not found", async (t) => {
    const fastify = build();

    findUserStub.restore();
    const findUserFailStub = ImportMock.mockFunction(userService, 'findById', null);

    t.teardown(() => {
        fastify.close();
        findUserFailStub.restore();
        deleteUserOtpStub.restore();
        generateOTPStub.restore();
        sendToQueueStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        payload: { userId, email }
    });

    t.equal(response.statusCode, 404);
    t.same(response.json(), { message: "No user found with this id" });
});