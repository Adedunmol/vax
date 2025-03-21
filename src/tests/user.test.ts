import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import build from '../app';
import { FastifyInstance } from 'fastify/types/instance';

// Ensure test mode
process.env.NODE_ENV = 'test';

let fastify: FastifyInstance;

// Setup Fastify before tests
before(async () => {
  fastify = build();
  await fastify.ready();
});

test("auth", async (t) => {
  await t.test("Registration", async (t) => {
    await t.test("✅ Should register a user successfully", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "test@example.com",
          password: "StrongPass123",
          name: "John Doe",
        },
      });

      assert.equal(response.statusCode, 201);
      assert.deepEqual(JSON.parse(response.body), { message: "User registered successfully" });
    });

    await t.test("❌ Should return error when required fields are missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "test@example.com",
          password: "StrongPass123", // Name missing
        },
      });

      assert.equal(response.statusCode, 400);
      assert.match(response.body, /Invalid request/);
    });

    await t.test("❌ Should return error for invalid email format", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "invalid-email",
          password: "StrongPass123",
          name: "John Doe",
        },
      });

      assert.equal(response.statusCode, 400);
      assert.match(response.body, /Invalid request/);
    });

    await t.test("❌ Should return error for weak password", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "weakpass@example.com",
          password: "123", // Too short
          name: "John Doe",
        },
      });

      assert.equal(response.statusCode, 400);
      assert.match(response.body, /Invalid request/);
    });

    await t.test("❌ Should return error when registering with an existing email", async () => {
      // First registration
      await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "duplicate@example.com",
          password: "StrongPass123",
          name: "Jane Doe",
        },
      });

      // Second registration with same email
      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "duplicate@example.com",
          password: "StrongPass123",
          name: "Jane Doe",
        },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Email already registered" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      // Mocking a crash by overriding the function
      fastify.post("/register", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "crash@example.com",
          password: "StrongPass123",
          name: "Server Error",
        },
      });

      assert.equal(response.statusCode, 500);
    });
  });

  await t.test("Login", async (t) => {
    // Pre-register a user for login tests
    const testEmail = "user@example.com";
    const testPassword = "StrongPass123";
    const testName = "Test User";

    await fastify.inject({
      method: "POST",
      url: "/register",
      payload: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    await t.test("✅ Should log in successfully", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      assert.equal(response.statusCode, 200);
      assert.deepEqual(JSON.parse(response.body), { message: "Login successful" });
    });

    await t.test("❌ Should return error when required fields are missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testEmail, // Password missing
        },
      });

      assert.equal(response.statusCode, 400);
      assert.match(response.body, /Invalid request/);
    });

    await t.test("❌ Should return error for invalid email format", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "invalid-email",
          password: testPassword,
        },
      });

      assert.equal(response.statusCode, 400);
      assert.match(response.body, /Invalid request/);
    });

    await t.test("❌ Should return error for incorrect password", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testEmail,
          password: "WrongPassword",
        },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid credentials" });
    });

    await t.test("❌ Should return error for unregistered email", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "notfound@example.com",
          password: testPassword,
        },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "User not found" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      // Mocking a crash by overriding the function
      fastify.post("/login", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "crash@example.com",
          password: "StrongPass123",
        },
      });

      assert.equal(response.statusCode, 500);
    });
  });

  await t.test("Logout", async (t) => {
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

      assert.equal(response.statusCode, 200);
      assert.deepEqual(JSON.parse(response.body), { message: "Logout successful" });
    });

    await t.test("❌ Should return error when no token is provided", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: {},
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "No token provided" });
    });

    await t.test("❌ Should return error for invalid or expired session", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: "invalid-token" },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid or expired session" });
    });

    await t.test("❌ Should return error when already logged out", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/logout",
        payload: { token: validToken },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid or expired session" });
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

      assert.equal(response.statusCode, 500);
    });
  });

  await t.test("Forgot Password Request", async (t) => {
    await t.test("✅ Should send reset link when email is valid", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "user@example.com" },
      });

      const responseBody = JSON.parse(response.body);
      assert.equal(response.statusCode, 200);
      assert.equal(responseBody.message, "Reset link sent");
      assert.match(responseBody.resetLink, /https:\/\/example\.com\/reset-password\?token=/);
    });

    await t.test("❌ Should return error when email is missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: {},
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Email is required" });
    });

    await t.test("❌ Should return error for invalid email format", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "invalid-email" },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid email format" });
    });

    await t.test("❌ Should return error for unregistered email", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/forgot-password",
        payload: { email: "notfound@example.com" },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "User not found" });
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

      assert.equal(response.statusCode, 500);
    });
  });

  await t.test("Reset Password", async (t) => {
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

      assert.equal(response.statusCode, 200);
      assert.deepEqual(JSON.parse(response.body), { message: "Password reset successful" });
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

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Token is required" });
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

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid or expired token" });
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

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Password must be at least 8 characters long" });
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

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Passwords do not match" });
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

      assert.equal(response.statusCode, 500);
    });
  });

  await t.test("Refresh Token", async (t) => {
    let validRefreshToken: string | null = null;

    // Simulate user login to get refresh token
    const generateTokenResponse = await fastify.inject({
      method: "POST",
      url: "/refresh-token",
      payload: { refreshToken: "" } //jwt.sign({ email: "user@example.com" }, JWT_REFRESH_SECRET!, { expiresIn: "7d" }) },
    });

    if (generateTokenResponse.statusCode === 200) {
      validRefreshToken = JSON.parse(generateTokenResponse.body).refreshToken;
    }

    await t.test("✅ Should refresh access token successfully", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: validRefreshToken },
      });

      const responseBody = JSON.parse(response.body);
      assert.equal(response.statusCode, 200);
      assert.match(responseBody.accessToken, /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/); // Valid JWT format
      assert.match(responseBody.refreshToken, /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/);
    });

    await t.test("❌ Should return error when refresh token is missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: {},
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Refresh token is required" });
    });

    await t.test("❌ Should return error for invalid refresh token", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: "invalid-token" },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid or expired refresh token" });
    });

    await t.test("❌ Should return error when refresh token is not found in DB", async () => {
      const fakeToken =  "" // jwt.sign({ email: "fakeuser@example.com" }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: fakeToken },
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.body), { error: "Invalid or expired refresh token" });
    });

    await t.test("❌ Should return error when server crashes", async () => {
      fastify.post("/refresh-token", async () => {
        throw new Error("Unexpected error");
      });

      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: validRefreshToken },
      });

      assert.equal(response.statusCode, 500);
    });
  });
});

