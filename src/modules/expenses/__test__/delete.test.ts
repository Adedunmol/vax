import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import expenseService from '../expenses.service';

const url = '/api/v1/expenses/1';
const userId = 100;

const deletedExpenseMock = {
  id: 1,
  category: 'Sample Category',
  amount: 150.75,
  expense_date: new Date().toISOString(),
  userId,
};

const deleteExpenseStub = ImportMock.mockFunction(expenseService, 'delete', deletedExpenseMock);

test("✅ Should delete an expense successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    deleteExpenseStub.restore();
  });

  const response = await fastify.inject({
    method: "DELETE",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Expense deleted successfully", data: deletedExpenseMock });
});

// Test: Missing expenseId
test("❌ Should return 400 if expenseId is missing", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
  });

  const response = await fastify.inject({
    method: "DELETE",
    url: '/api/v1/expenses/',
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 400);
  t.same(response.json(), { message: "expenseId is required" });
});

// Test: Expense not found
test("❌ Should return 404 if expense does not exist", async (t) => {
  const fastify = build();
  deleteExpenseStub.restore();
  const notFoundStub = ImportMock.mockFunction(expenseService, 'delete', null);

  t.teardown(() => {
    fastify.close();
    notFoundStub.restore();
  });

  const response = await fastify.inject({
    method: "DELETE",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 404);
  t.same(response.json(), { message: "No expense found with the id" });
});

// Test: Internal server error
test("❌ Should return 500 for internal server error", async (t) => {
  const fastify = build();
  deleteExpenseStub.restore();
  const errorStub = ImportMock.mockFunction(expenseService, 'delete', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "DELETE",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
