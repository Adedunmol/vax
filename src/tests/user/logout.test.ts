import { test } from 'tap';
import build from '../../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test("Logout", async (t) => {

    const fastify = build()

    t.afterEach(() => {
        fastify.close()
    })

    let validToken: string | null = null;

    // Simulate login to get a session token
    const loginResponse = await fastify.inject({
      method: "POST",
      url: "/login",
      payload: {
        email: "user@example.com",
        password: "StrongPass123",
      },
    });

    if (loginResponse.statusCode === 200) {
      validToken = JSON.parse(loginResponse.body).token;
    }

    await t.test("✅ Should log out successfully", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: validToken },
      });

      t.equal(response.statusCode, 200);
      t.same(response.json(), { message: "Logout successful" });
    });

    await t.test("❌ Should return error when no token is provided", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: {},
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "No token provided" });
    });

    await t.test("❌ Should return error for invalid or expired session", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: "invalid-token" },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid or expired session" });
    });

    await t.test("❌ Should return error when already logged out", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: validToken },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid or expired session" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      fastify.post("/logout", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: "valid-token" },
      });

      t.equal(response.statusCode, 500);
    });
  });