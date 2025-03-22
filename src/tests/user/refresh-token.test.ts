import { test } from 'tap';
import build from '../../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test("Refresh Token", async (t) => {
    const fastify = build()

    t.afterEach(() => {
        fastify.close()
    })
    
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
      t.equal(response.statusCode, 200);
      t.match(responseBody.accessToken, /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/); // Valid JWT format
      t.match(responseBody.refreshToken, /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/);
    });

    await t.test("❌ Should return error when refresh token is missing", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: {},
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Refresh token is required" });
    });

    await t.test("❌ Should return error for invalid refresh token", async () => {
      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: "invalid-token" },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid or expired refresh token" });
    });

    await t.test("❌ Should return error when refresh token is not found in DB", async () => {
      const fakeToken =  "" // jwt.sign({ email: "fakeuser@example.com" }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

      const response = await fastify.inject({
        method: "POST",
        url: "/refresh-token",
        payload: { refreshToken: fakeToken },
      });

      t.equal(response.statusCode, 400);
      t.same(response.json(), { error: "Invalid or expired refresh token" });
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

      t.equal(response.statusCode, 500);
    });
  });