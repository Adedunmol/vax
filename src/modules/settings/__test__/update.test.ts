import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import settingsService from '../settings.service';

const url = '/api/v1/settings/update';

const validSettings = {
  currency: 'USD',
  custom_logo: faker.image.url(),
  notify_before: 3,
  recurrent_reminders: true,
  recurrent_interval: 7,
};

const updateSettingsStub = ImportMock.mockFunction(settingsService, 'update', validSettings);

test("✅ Should update settings successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    updateSettingsStub.restore();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
    payload: validSettings,
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Settings updated successfully", data: validSettings });
});

// Test: Invalid currency length
test("❌ Should return error for invalid currency length", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
    payload: { currency: "US" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /currency/);
});

// Test: Negative notify_before
test("❌ Should return error for negative notify_before", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
    payload: { notify_before: -1 },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /notify_before/);
});

// Test: Negative recurrent_interval
test("❌ Should return error for negative recurrent_interval", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
    payload: { recurrent_interval: -5 },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /recurrent_interval/);
});

// Test: Invalid data types
test("❌ Should return error for invalid data types", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
    payload: { currency: 123, notify_before: "ten" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /currency|notify_before/);
});

// Test: No payload
test("❌ Should return error if no payload is provided", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PATCH",
    url,
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Invalid request payload/);
});
