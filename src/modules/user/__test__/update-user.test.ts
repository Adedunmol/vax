import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import userService from '../user.service';

const url = '/api/v1/users/update';

const firstName = faker.person.firstName();
const lastName = faker.person.lastName();
const username = faker.internet.userName();
const id = Math.floor(Math.random() * 1000);

const updateUserStub = ImportMock.mockFunction(userService, 'update', {
  first_name: firstName,
  last_name: lastName,
  username,
  id,
});

test('✅ Should update user successfully', async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    updateUserStub.restore();
  });

  const response = await fastify.inject({
    method: 'PUT',
    url,
    payload: {
      first_name: firstName,
      last_name: lastName,
      username,
    },
    headers: { Authorization: 'Bearer test-token' },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), {
    message: 'User updated successfully',
    data: {
      first_name: firstName,
      last_name: lastName,
      username,
      id,
    },
  });
});

test('❌ Should return 409 if username already exists', async (t) => {
  const fastify = build();

  updateUserStub.returns(Promise.reject({ code: '23505', detail: '(username)=() already exists' }));

  t.teardown(() => {
    fastify.close();
    updateUserStub.restore();
  });

  const response = await fastify.inject({
    method: 'PUT',
    url,
    payload: { username },
    headers: { Authorization: 'Bearer test-token' },
  });

  t.equal(response.statusCode, 409);
  t.same(response.json(), { error: 'username already exists' });
});

test('❌ Should return 500 on unexpected error', async (t) => {
  const fastify = build();

  updateUserStub.returns(Promise.reject(new Error('Unexpected error')));

  t.teardown(() => {
    fastify.close();
    updateUserStub.restore();
  });

  const response = await fastify.inject({
    method: 'PUT',
    url,
    payload: { first_name: firstName },
    headers: { Authorization: 'Bearer test-token' },
  });

  t.equal(response.statusCode, 500);
});
