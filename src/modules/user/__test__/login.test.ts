import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import UserService from '../user.service';
import bcrypt from 'bcrypt';

const email = faker.internet.email();
const password = faker.internet.password();
const hashedPassword = bcrypt.hashSync(password, 10);

test("✅ Should login successfully", async (t) => {
    const fastify = build();
    const userStub = ImportMock.mockFunction(UserService, 'findByEmail', {
        id: faker.number.int(),
        email,
        password: hashedPassword
    });
    
    const response = await fastify.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, password }
    });

    t.equal(response.statusCode, 200);
    t.ok(response.json().accessToken);

    userStub.restore();
    fastify.close();
});

test("❌ Should return 401 for incorrect credentials", async (t) => {
    const fastify = build();
    ImportMock.mockFunction(UserService, 'findByEmail', {
        id: faker.number.int(),
        email,
        password: hashedPassword
    });
    
    const response = await fastify.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, password: "wrongpassword" }
    });

    t.equal(response.statusCode, 401);
    t.match(response.json(), { message: /invalid credentials/ });

    fastify.close();
});

test("❌ Should return 400 for missing email", async (t) => {
    const fastify = build();
    const response = await fastify.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { password }
    });
    t.equal(response.statusCode, 400);
    t.match(response.json(), { message: /email is required/ });
    fastify.close();
});

test("❌ Should return 500 if an internal error occurs", async (t) => {
    const fastify = build();
    const errorStub = ImportMock.mockFunction(UserService, 'findByEmail', () => {
        throw new Error("Database error");
    });
    
    t.teardown(() => {
        fastify.close();
        errorStub.restore();
    });

    const response = await fastify.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, password }
    });

    t.equal(response.statusCode, 500);
});