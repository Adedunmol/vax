import { test } from 'tap';
import build from '../../../app';
import { faker } from '@faker-js/faker';
import { ImportMock } from 'ts-mock-imports';
import { expenseAnalytics, revenueAnalytics } from '../analytics.service';

const userId = faker.number.int(100);
const email = faker.internet.email()

const authUser = { id: userId, email };

const injectWithAuth = (fastify: any, type: string, token: string) =>
  fastify.inject({
    method: 'GET',
    url: `/api/v1/analytics/expenses?type=${type}`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

test('✅ Should return total expenses', async (t) => {
  const fastify = await build();

  const stub = ImportMock.mockFunction(expenseAnalytics, 'totalExpenses', { total: 3500 });
  
  t.teardown(async () => {
    stub.restore()
    await fastify.close()
  })


  const res = await injectWithAuth(fastify, 'total', fastify.jwt.sign(authUser));

  t.equal(res.statusCode, 200);
  t.match(res.json().data, { total: 3500 });
});

// test('✅ Should return category expenses', async (t) => {
//   const fastify = await build();

//   const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'categoryExpenses', [
//     { category: 'Travel', total: 1200 },
//     { category: 'Software', total: 2300 }
//   ]);

//   t.teardown(async () => {
//     stub.restore()
//     await fastify.close()
//   })

//   const res = await injectWithAuth(fastify, 'category', fastify.jwt.sign(authUser));

//   t.equal(res.statusCode, 200);
//   t.same(res.json().data.expense.length, 2);
// });

// test('✅ Should return expense trend', async (t) => {
//   const fastify = await build();

//   const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'trendExpenses', [
//     { month: '2025-03', total: 1500 },
//     { month: '2025-04', total: 2000 }
//   ]);

//   t.teardown(async () => {
//     stub.restore()
//     await fastify.close()
//   })

//   const res = await injectWithAuth(fastify, 'trend', fastify.jwt.sign(authUser));

//   t.equal(res.statusCode, 200);
//   t.same(res.json().data.expense.length, 2);
// });

// test('✅ Should return revenue-to-expense ratio', async (t) => {
//   const fastify = await build();

//   const totalRevenueStub = ImportMock.mockFunction(RevenueAnalytics.prototype, 'totalRevenue', { total: 10000 });
//   const totalExpensesStub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'totalExpenses', { total: 2500 });

//   const stub = ImportMock.mockFunction(ExpenseAnalytics.prototype, 'ratioExpenses', {
//     ratio: 0.25,
//   });

//   t.teardown(async () => {

//     stub.restore()
//     totalRevenueStub.restore()
//     totalExpensesStub.restore()
//     await fastify.close()
//   })

//   const res = await injectWithAuth(fastify, 'ratio', fastify.jwt.sign(authUser));

//   console.log(res.json())

//   t.equal(res.statusCode, 200);
//   t.match(res.json().data.expense, { ratio: 0.25 });
// });

// test('❌ Should return 400 for unknown expense type', async (t) => {
//   const fastify =await build();

//   t.teardown(async () => {
//     await fastify.close()
//   })
//   const res = await injectWithAuth(fastify, 'invalid-type', fastify.jwt.sign(authUser));

//   console.log(res.json())

//   t.equal(res.statusCode, 400);
//   t.match(res.json(), { message: 'Group by query is unknown' });
// });
