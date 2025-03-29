import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';
import * as queue from '../../../queues';

const url = '/api/v1/auth/reset-password-request';
const email = faker.internet.email();
const userId = Math.floor(Math.random() * 1000);
const otp = '1234';

const findByEmailStub = ImportMock.mockFunction(userService, 'findByEmail', {
  id: userId,
  email,
  verified: true,
});
const deleteUserOtpStub = ImportMock.mockFunction(userService, 'deleteUserOtp', {});
const generateOtpStub = ImportMock.mockFunction(userService, 'generateOTP', otp);
const sendToQueueStub = ImportMock.mockFunction(queue, 'sendToQueue', {});

test('✅ Should send a reset password OTP successfully', async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    findByEmailStub.restore();
    deleteUserOtpStub.restore();
    generateOtpStub.restore();
    sendToQueueStub.restore();
  });

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), {
    status: 'success',
    message: 'otp has been sent to the provided email',
    data: { userId, email, otp },
  });
});

test("❌ Should return 404 if user is not found", async (t) => {
  findByEmailStub.returns(null);
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    findByEmailStub.restore();
  });

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { email },
  });

  t.equal(response.statusCode, 404);
  t.same(response.json(), { message: "No user found with this email" });
});

test("❌ Should return 400 if email is not verified", async (t) => {
  findByEmailStub.returns({ id: userId, email, verified: false });
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    findByEmailStub.restore();
  });

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: { email },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: "Email hasn't been verified yet. Check your inbox." });
});