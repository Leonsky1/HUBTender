import { test } from '@playwright/test';

test('Триггер пересчёта с логами', async ({ page }) => {
  // Слушаем консоль браузера ПЕРЕД переходом
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
  });

  // Переходим на страницу коммерции
  await page.goto('http://localhost:3001/commerce');
  await page.waitForSelector('h3:has-text("Коммерция")', { timeout: 10000 });

  // Выбираем ЖК Адмирал
  const tenderSelect = page.locator('.ant-select').first();
  await tenderSelect.click();
  await page.waitForTimeout(500);

  const admiralOption = page.locator('.ant-select-dropdown .ant-select-item').filter({
    hasText: 'ЖК Адмирал'
  });

  if (await admiralOption.count() > 0) {
    await admiralOption.first().click();
    console.log('✅ Выбран тендер ЖК Адмирал');
    await page.waitForTimeout(1500);
  }

  // Жмём пересчитать
  const recalcButton = page.locator('button:has-text("Пересчитать")');
  if (await recalcButton.count() > 0) {
    console.log('🔄 Нажимаем кнопку Пересчитать...');
    await recalcButton.click();
    console.log('⏳ Ожидаем завершения пересчёта...');
    await page.waitForTimeout(8000); // Даём время на расчёт и вывод логов
  }

  console.log('✅ Логи собраны');
});
