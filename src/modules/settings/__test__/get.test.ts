import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import SettingsService from '../settings.service';

const userId = faker.number.int();
const email = faker.internet.email()
const authUser = { id: userId, email };

const injectWithAuth = (fastify: any) =>
  fastify.inject({
    method: 'GET',
    url: '/api/v1/settings',
    headers: {
      'Authorization': 'Bearer mocked-token'
    }
  });

test('✅ Should return user settings successfully', async (t) => {
  const fastify = build();

  // Mocking SettingsService.get method
  const stub = ImportMock.mockFunction(SettingsService, 'get', {
    currency: 'USD',
    notify_before: 30,
    recurrent_reminders: true,
    recurrent_interval: 7
  });

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
})

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', authUser);
  // }  
  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 200);
  t.match(res.json().data, { currency: 'USD', notify_before: 30, recurrent_reminders: true, recurrent_interval: 7 });
});

test('❌ Should return 500 when there is an internal server error', async (t) => {
  const fastify = build();

  // Mocking SettingsService.get to throw an error
  const stub = ImportMock.mockFunction(SettingsService, 'get', () => {
    throw new Error('Database error');
  });

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
})

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', authUser);
  // }

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 500);
  t.match(res.json().message, 'Database error');
});

test('❌ Should return 400 if user is not authenticated', async (t) => {
  const fastify = build();

  t.teardown(async () => {
    await fastify.close()
})

  // No user is attached to the request
  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 401); // Unauthorized because no authentication token
  t.match(res.json().message, 'Unauthorized');
});

test('❌ Should return 404 if user settings do not exist', async (t) => {
  const fastify = build();

  // Mocking SettingsService.get to return null for non-existing user
  const stub = ImportMock.mockFunction(SettingsService, 'get', null);

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
})

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', authUser);
  // }

  const res = await injectWithAuth(fastify);

  t.equal(res.statusCode, 404);
  t.match(res.json().message, 'No settings found for the user');
});
