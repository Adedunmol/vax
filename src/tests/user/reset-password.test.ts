import { test } from 'tap';
import build from '../../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test("Reset Password", async (t) => {

    const fastify = build()

    t.afterEach(() => {
        fastify.close()
    })

    let validToken: string | null = null;

    // Simulate generating a reset token
    const generateTokenResponse = await fastify.inject({
      method: "POST",
      url: "/forgot-password",
      payload: { email: "user@example.com" },
    });

    if (generateTokenResponse.statusCode === 200) {
      validToken = JSON.parse(generateTokenResponse.body).resetLink.split("=")[1];
    }

    await t.test("✅ Should reset password successfully", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          token: validToken,
          newPassword: "NewSecurePass123",
          confirmPassword: "NewSecurePass123",
        },
      });

      t.equal(response.statusCode, 200);
      t.same(response.json(), { message: "Password reset successful" });
    });

    await t.test("❌ Should return error when token is missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          newPassword: "NewSecurePass123",
          confirmPassword: "NewSecurePass123",
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Token is required" });
    });

    await t.test("❌ Should return error for invalid or expired token", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          token: "invalid-token",
          newPassword: "NewSecurePass123",
          confirmPassword: "NewSecurePass123",
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid or expired token" });
    });

    await t.test("❌ Should return error for weak password", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          token: validToken,
          newPassword: "123",
          confirmPassword: "123",
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Password must be at least 8 characters long" });
    });

    await t.test("❌ Should return error when passwords do not match", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          token: validToken,
          newPassword: "NewSecurePass123",
          confirmPassword: "DifferentPass123",
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Passwords do not match" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      fastify.post("/reset-password", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/reset-password",
        payload: {
          token: validToken,
          newPassword: "NewSecurePass123",
          confirmPassword: "NewSecurePass123",
        },
      });

      t.equal(response.statusCode, 500);
    });
  });