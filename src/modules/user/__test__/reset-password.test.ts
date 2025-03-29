import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';
import bcrypt from 'bcrypt';

const url = '/api/v1/auth/reset-password';
const email = faker.internet.email();
const password = faker.internet.password();
const otp = '123456';
const userId = Math.floor(Math.random() * 1000);
const hashedOTP = bcrypt.hashSync(otp, 10);
const hashedPassword = bcrypt.hashSync(password, 10);
const expiredDate = Date.now() - 1000;

const findByEmailStub = ImportMock.mockFunction(userService, 'findByEmail', {
  id: userId,
  email,
  verified: true,
});

const findUserWithOtpStub = ImportMock.mockFunction(userService, 'findUserWithOtp', [{
  otp: hashedOTP,
  expiresAt: Date.now() + 100000,
}]);

const compareOtpStub = ImportMock.mockFunction(bcrypt, 'compare', true);
const hashPasswordStub = ImportMock.mockFunction(userService, 'hashPassword', hashedPassword);
const updateUserStub = ImportMock.mockFunction(userService, 'update', {});
const deleteUserOtpStub = ImportMock.mockFunction(userService, 'deleteUserOtp', {});

test('✅ Should reset password successfully', async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    findByEmailStub.restore();
    findUserWithOtpStub.restore();
    compareOtpStub.restore();
    hashPasswordStub.restore();
    updateUserStub.restore();
    deleteUserOtpStub.restore();
  });

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email, password, otp },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { status: 'success', message: 'Password changed successfully', data: null });
});

test('❌ Should return 404 if user is not found', async (t) => {
  findByEmailStub.returns(null);
  const fastify = build();

  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email, password, otp },
  });

  t.equal(response.statusCode, 404);
  t.same(response.json(), { message: 'No user found with this email' });
});

test('❌ Should return 400 if password reset request was not made', async (t) => {
  findUserWithOtpStub.returns([]);
  const fastify = build();

  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email, password, otp },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: 'Password reset request has not been made.' });
});

test('❌ Should return 400 if OTP is expired', async (t) => {
  findUserWithOtpStub.returns([{ otp: hashedOTP, expiresAt: expiredDate }]);
  const fastify = build();

  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email, password, otp },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: 'Code has expired. Please request again.' });
});

test('❌ Should return 400 if OTP is invalid', async (t) => {
  compareOtpStub.returns(false);
  const fastify = build();

  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url,
    payload: { email, password, otp },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: 'Invalid code passed. Check your inbox.' });
});
