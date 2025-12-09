import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://delivery.local';

test('auth -> create order -> view detail', async ({ page }) => {
  const email = `demo${Date.now()}@example.com`;
  const password = 'password123';

  // Register
  await page.goto(`${baseURL}/register`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Login и получить токен
  await page.goto(`${baseURL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500); // дать время на сохранение токена
  let token = await page.evaluate(() => localStorage.getItem('orderdesk_token'));
  if (!token) {
    const resp = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email, password }
    });
    const body = await resp.json();
    token = body.accessToken;
    await page.evaluate(
      ([k, v]) => {
        if (v) localStorage.setItem(k as string, v as string);
      },
      ['orderdesk_token', token]
    );
  }
  expect(token).toBeTruthy();
  await page.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });
  await page.goto(`${baseURL}/orders`);

  // Create order with pricing
  await page.goto(`${baseURL}/orders/create`);
  await page.getByLabel('Маршрут').fill('US-RU');
  await page.getByLabel('Название').fill('Тестовый заказ');
  await page.getByText('Рассчитать стоимость').click({ timeout: 20000 });
  await page.getByRole('button', { name: 'Создать' }).click({ timeout: 20000 });

  // Order detail + API проверки
  const match = page.url().match(/orders\/([^/]+)/);
  const orderId = match?.[1];
  await expect(orderId).toBeTruthy();
  const authHeader = { Authorization: `Bearer ${token}` };

  // Проверка статуса заказа через API
  const getResp = await page.request.get(`${baseURL}/api/orders/${orderId}`, { headers: authHeader });
  expect(getResp.ok()).toBeTruthy();

  // Обновить статус
  const statusResp = await page.request.post(`${baseURL}/api/orders/${orderId}/status`, {
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    data: { status: 'shipping' }
  });
  expect(statusResp.ok()).toBeTruthy();

  // Отправить сообщение в чат
  const chatResp = await page.request.post(`${baseURL}/api/chat/${orderId}/messages`, {
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    data: { sender: 'e2e', content: 'Test message' }
  });
  expect(chatResp.ok()).toBeTruthy();
});
