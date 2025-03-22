import { test } from 'tap';
import build from '../../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test("Forgot Password Request", async (t) => {
    const fastify = build()

    t.afterEach(() => {
        fastify.close()
    })
    
    await t.test("✅ Should send reset link when email is valid", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "user@example.com" },
      });

      const responseBody = JSON.parse(response.body);
      t.equal(response.statusCode, 200);
      t.equal(responseBody.message, "Reset link sent");
      t.match(responseBody.resetLink, /https:\/\/example\.com\/reset-password\?token=/);
    });

    await t.test("❌ Should return error when email is missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: {},
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Email is required" });
    });

    await t.test("❌ Should return error for invalid email format", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "invalid-email" },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid email format" });
    });

    await t.test("❌ Should return error for unregistered email", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "notfound@example.com" },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "User not found" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      fastify.post("/forgot-password", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "user@example.com" },
      });

      t.equal(response.statusCode, 500);
    });
  });