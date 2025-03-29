import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import expenseService from '../expenses.service';

const url = '/api/v1/expenses';
const expenseId = 1;
const userId = 100;

const expenseMock = {
  id: expenseId,
  category: 'Office Supplies',
  amount: 150.75,
  expense_date: new Date().toISOString(),
  userId,
};

const getExpenseStub = ImportMock.mockFunction(expenseService, 'get', expenseMock);

test("✅ Should retrieve an expense successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getExpenseStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${expenseId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Expense retrieved successfully", data: expenseMock });
});

// Test: Missing expenseId
test("❌ Should return error when expenseId is missing", async (t) => {
  const fastify = build();
  t.teardown(() => fastify.close());

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.match(response.json().message, /expenseId is required/);
});

// Test: Expense not found
test("❌ Should return error when expense is not found", async (t) => {
  const fastify = build();
  getExpenseStub.restore();
  const notFoundStub = ImportMock.mockFunction(expenseService, 'get', null);

  t.teardown(() => {
    fastify.close();
    notFoundStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${expenseId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 404);
  t.match(response.json().message, /No expense found with the id/);
});

// Test: Internal server error
test("❌ Should return error for internal server error", async (t) => {
  const fastify = build();
  getExpenseStub.restore();
  const errorStub = ImportMock.mockFunction(expenseService, 'get', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url: `${url}/${expenseId}`,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
