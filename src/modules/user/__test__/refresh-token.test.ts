import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import UserService from '../user.service';
import { faker } from '@faker-js/faker';

const url = '/api/v1/auth/refresh-token';
const fakeEmail = faker.internet.email();
const fakeId = faker.string.uuid();
const fakeToken = faker.string.uuid();

const findUserWithTokenStub = ImportMock.mockFunction(UserService, 'findUserWithToken');
const findByEmailStub = ImportMock.mockFunction(UserService, 'findByEmail');
const updateUserStub = ImportMock.mockFunction(UserService, 'update');

test("✅ Should refresh token successfully", async (t) => {
    const fastify = build();

    findUserWithTokenStub.returns({ id: fakeId, email: fakeEmail });

    t.teardown(() => {
        fastify.close();
        findUserWithTokenStub.restore();
        updateUserStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: fakeToken }
    });

    t.equal(response.statusCode, 200);
    t.match(response.json(), { status: 'success', data: { accessToken: /.+/ } });
});

test("❌ Should return 401 if refresh token is missing", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url
    });

    t.equal(response.statusCode, 401);
    t.match(response.json(), { message: 'You are not authorized to access this route' });
});

test("❌ Should return 401 if token reuse is detected", async (t) => {
    const fastify = build();

    findUserWithTokenStub.returns(null);
    findByEmailStub.returns({ id: fakeId, email: fakeEmail });

    t.teardown(() => {
        fastify.close();
        findUserWithTokenStub.restore();
        findByEmailStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: fakeToken }
    });

    t.equal(response.statusCode, 401);
    t.match(response.json(), { message: 'Token reuse' });
});

test("❌ Should return 403 if token is invalid", async (t) => {
    const fastify = build();

    findUserWithTokenStub.returns({ id: fakeId, email: fakeEmail });
    updateUserStub.throws(new Error("Invalid token"));

    t.teardown(() => {
        fastify.close();
        findUserWithTokenStub.restore();
        updateUserStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: "invalid-token" }
    });

    t.equal(response.statusCode, 403);
    t.match(response.json(), { message: 'bad token' });
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();

    findUserWithTokenStub.throws(new Error("Database error"));

    t.teardown(() => {
        fastify.close();
        findUserWithTokenStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: fakeToken }
    });

    t.equal(response.statusCode, 500);
});
