import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import expenseService from '../expenses.service';

const url = '/api/v1/expenses/1';
const userId = 100;

const updatedExpenseMock = {
  id: 1,
  category: 'Updated Category',
  amount: 200.50,
  expense_date: new Date().toISOString(),
  userId,
};

const updateExpenseStub = ImportMock.mockFunction(expenseService, 'update', updatedExpenseMock);

test("✅ Should update an expense successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    updateExpenseStub.restore();
  });

  const response = await fastify.inject({
    method: "PUT",
    url,
    payload: {
      category: 'Updated Category',
      amount: 200.50,
      expense_date: new Date().toISOString(),
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Expense updated successfully", data: updatedExpenseMock });
});

// Test: Missing expenseId
test("❌ Should return 400 if expenseId is missing", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "PUT",
    url: '/api/v1/expenses/',
    payload: {
      category: 'Updated Category',
      amount: 200.50,
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: "expenseId is required" });
});

// Test: Expense not found
test("❌ Should return 404 if expense does not exist", async (t) => {
  const fastify = build();
  updateExpenseStub.restore();
  const notFoundStub = ImportMock.mockFunction(expenseService, 'update', null);

  t.teardown(() => {
    fastify.close();
    notFoundStub.restore();
  });

  const response = await fastify.inject({
    method: "PUT",
    url,
    payload: {
      category: 'Updated Category',
      amount: 200.50,
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 404);
  t.same(response.json(), { message: "No expense found with the id" });
});

// Test: Internal server error
test("❌ Should return 500 for internal server error", async (t) => {
  const fastify = build();
  updateExpenseStub.restore();
  const errorStub = ImportMock.mockFunction(expenseService, 'update', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "PUT",
    url,
    payload: {
      category: 'Updated Category',
      amount: 200.50,
    },
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
