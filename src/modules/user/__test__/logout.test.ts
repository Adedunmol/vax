import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import UserService from '../user.service';

const url = '/api/v1/auth/logout';
const refreshToken = 'valid_refresh_token';

const findUserStub = ImportMock.mockFunction(UserService, 'findUserWithToken', {
    id: 1,
    email: 'test@example.com',
    refreshToken
});

const updateUserStub = ImportMock.mockFunction(UserService, 'update', {});

test("✅ Should logout successfully", async (t) => {
    const fastify = build();
    
    t.teardown(() => {
        fastify.close();
        findUserStub.restore();
        updateUserStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: refreshToken }
    });

    t.equal(response.statusCode, 204);
    t.notOk(response.headers['set-cookie']);
});

test("✅ Should return 204 if no refresh token is provided", async (t) => {
    const fastify = build();
    t.teardown(() => fastify.close());

    const response = await fastify.inject({
        method: "POST",
        url
    });

    t.equal(response.statusCode, 204);
});

test("✅ Should return 204 if token is invalid and clear cookie", async (t) => {
    const fastify = build();
    const invalidTokenStub = ImportMock.mockFunction(UserService, 'findUserWithToken', null);
    
    t.teardown(() => {
        fastify.close();
        invalidTokenStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: 'invalid_token' }
    });

    t.equal(response.statusCode, 204);
    t.notOk(response.headers['set-cookie']);
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(UserService, 'findUserWithToken', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url,
        cookies: { jwt: refreshToken }
    });

    t.equal(response.statusCode, 500);
});
