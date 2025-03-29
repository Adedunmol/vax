import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import expenseService from '../expenses.service';

const url = '/api/v1/expenses';

const category = faker.commerce.department();
const amount = faker.number.float({ min: 1, max: 1000 }); // precision: 0.01
const expenseDate = new Date().toISOString();
const userId = faker.number.int();
const expenseId = faker.number.int();

const createExpenseStub = ImportMock.mockFunction(expenseService, 'create', {
  id: expenseId,
  category,
  amount,
  expense_date: expenseDate,
  userId,
});

test("✅ Should create an expense successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    createExpenseStub.restore();
  });

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: {
      category,
      amount,
      expense_date: expenseDate,
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 201);
  t.same(response.json(), { message: "Expense created successfully", data: createExpenseStub.getMockImplementation() });
});

// Test: Missing required fields
test("❌ Should return error for missing required fields", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: {},
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /category is required|amount is required/);
});

// Test: Invalid expense_date format
test("❌ Should return error for invalid expense_date format", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: {
      category,
      amount,
      expense_date: "invalid-date",
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /Invalid expense_date format/);
});

// Test: Internal server error
test("❌ Should return error for internal server error", async (t) => {
  const fastify = build();
  createExpenseStub.restore();
  const errorStub = ImportMock.mockFunction(expenseService, 'create', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "POST",
    url,
    payload: {
      category,
      amount,
      expense_date: expenseDate,
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
