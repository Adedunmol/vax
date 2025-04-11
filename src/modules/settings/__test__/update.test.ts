import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import SettingsService from '../settings.service';

const userId = faker.number.int();
const email = faker.internet.email();

const authUser = { id: userId, email };

const injectWithAuth = (fastify: any, body: any) =>
  fastify.inject({
    method: 'PATCH',
    url: '/api/v1/settings/update',
    headers: {
      'Authorization': 'Bearer mocked-token'
    },
    payload: body
  });

test('✅ Should update user settings successfully', async (t) => {
  const fastify = build();

  const payload = {
    currency: 'USD',
    custom_logo: faker.image.url(),
    notify_before: 3,
    recurrent_reminders: true,
    recurrent_interval: 7
  };

  const stub = ImportMock.mockFunction(SettingsService, 'update', { id: userId, ...payload });


  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 200);
  t.match(res.json().data, { ...payload });
});

test('✅ Should allow partial update of user settings', async (t) => {
  const fastify = build();

  const payload = {
    currency: 'EUR'
  };

  const stub = ImportMock.mockFunction(SettingsService, 'update', { id: userId, ...payload });


  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 200);
  t.match(res.json().data, { currency: 'EUR' });
});

test('❌ Should return 400 for invalid payload (bad currency length)', async (t) => {
  const fastify = build();

  const payload = {
    currency: 'US' // too short
  };


  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /currency/i);
});

test('❌ Should return 400 for invalid payload (negative notify_before)', async (t) => {
  const fastify = build();

  const payload = {
    notify_before: -1
  };

  t.teardown(async () => {
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }
  
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 400);
  t.match(res.json().message, /notify_before/i);
});

test('❌ Should return 500 if service throws error', async (t) => {
  const fastify = build();

  const payload = {
    currency: 'USD'
  };

  const stub = ImportMock.mockFunction(SettingsService, 'update');
  stub.rejects(new Error('Something went wrong'));

  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })

  // if (!fastify.hasRequestDecorator('user')) {
  //   fastify.decorateRequest('user', null)
  // }

  fastify.addHook('preHandler', (req, _reply, done) => {
    req.user = authUser;
    done();
  });

  const res = await injectWithAuth(fastify, payload);

  t.equal(res.statusCode, 500);
  t.match(res.json().message ?? res.json().error, /something went wrong/i);
});
