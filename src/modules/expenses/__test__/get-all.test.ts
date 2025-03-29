import { test } from 'tap';
import build from '../../../app';
import { ImportMock } from 'ts-mock-imports';
import expenseService from '../expenses.service';

const url = '/api/v1/expenses';
const userId = 100;

const expensesMock = [
  {
    id: 1,
    category: 'Office Supplies',
    amount: 150.75,
    expense_date: new Date().toISOString(),
    userId,
  },
  {
    id: 2,
    category: 'Software Subscription',
    amount: 99.99,
    expense_date: new Date().toISOString(),
    userId,
  }
];

const getAllExpensesStub = ImportMock.mockFunction(expenseService, 'getAll', expensesMock);

test("✅ Should retrieve all expenses successfully", async (t) => {
  const fastify = build();

  t.teardown(() => {
    fastify.close();
    getAllExpensesStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Expenses retrieved successfully", data: { expenses: expensesMock } });
});

// Test: No expenses found
test("✅ Should return empty list when no expenses are found", async (t) => {
  const fastify = build();
  getAllExpensesStub.restore();
  const emptyStub = ImportMock.mockFunction(expenseService, 'getAll', []);

  t.teardown(() => {
    fastify.close();
    emptyStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 200);
  t.same(response.json(), { message: "Expenses retrieved successfully", data: { expenses: [] } });
});

// Test: Internal server error
test("❌ Should return error for internal server error", async (t) => {
  const fastify = build();
  getAllExpensesStub.restore();
  const errorStub = ImportMock.mockFunction(expenseService, 'getAll', () => {
    throw new Error("Database error");
  });

  t.teardown(() => {
    fastify.close();
    errorStub.restore();
  });

  const response = await fastify.inject({
    method: "GET",
    url,
    headers: { Authorization: "Bearer valid-token" },
  });

  t.equal(response.statusCode, 500);
  t.match(response.json().message, /Database error/);
});
