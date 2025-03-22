import { test } from 'tap';
import build from '../../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test("login", async (t) => {
    const fastify = build()

    t.afterEach(() => {
        fastify.close()
    })

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

      t.equal(response.statusCode, 200);
      t.same(response.json(), { message: "Login successful" });
    });

    await t.test("❌ Should return error when required fields are missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testEmail, // Password missing
        },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), /Invalid request/);
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

      t.equal(response.statusCode, 400);
      t.same(response.json(), /Invalid request/);
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

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid credentials" });
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

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "User not found" });
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

      t.equal(response.statusCode, 500);
    });
  });
