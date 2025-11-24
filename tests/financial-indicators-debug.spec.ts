import { test, expect } from '@playwright/test';

test.describe('Финансовые показатели - отладка параметра 0,6к', () => {
  test('Детальный анализ с выбором тендера и console логами', async ({ page }) => {
    const consoleLogs: any[] = [];

    // Перехватываем все console.log
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });

      // Выводим в консоль теста в реальном времени
      if (type === 'log' || type === 'error' || type === 'warning') {
        console.log(`[Browser ${type}]`, text);
      }
    });

    // Переход на страницу финансовых показателей
    console.log('\n=== Переход на страницу финансовых показателей ===');
    await page.goto('http://localhost:3003/financial-indicators');

    // Ожидание загрузки страницы
    await page.waitForSelector('h4:has-text("Финансовые показатели")', { timeout: 10000 });
    console.log('✓ Страница загружена');

    // Проверяем наличие селектора тендера
    const tenderSelect = page.locator('.ant-select').first();
    await expect(tenderSelect).toBeVisible();
    console.log('✓ Селектор тендера найден');

    // Кликаем на селектор
    console.log('\n=== Выбор тендера ===');
    await tenderSelect.click();

    // Ждём появления выпадающего списка
    await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
    console.log('✓ Выпадающий список открыт');

    // Получаем список тендеров
    const tenderOptions = page.locator('.ant-select-item');
    const tenderCount = await tenderOptions.count();
    console.log(`Найдено тендеров: ${tenderCount}`);

    if (tenderCount === 0) {
      console.log('⚠️ Нет доступных тендеров!');
      return;
    }

    // Выбираем первый тендер
    const firstOption = tenderOptions.first();
    const tenderName = await firstOption.innerText();
    console.log(`Выбираем тендер: ${tenderName}`);
    await firstOption.click();

    // Ждём загрузки данных
    console.log('\n=== Ожидание загрузки данных ===');
    await page.waitForTimeout(3000);

    // Проверяем наличие таблицы
    const table = page.locator('.ant-table');
    const isTableVisible = await table.isVisible();
    console.log(`Таблица видима: ${isTableVisible}`);

    if (isTableVisible) {
      // Получаем строки таблицы
      const rows = page.locator('.ant-table-tbody tr');
      const rowCount = await rows.count();
      console.log(`\nВсего строк в таблице: ${rowCount}`);

      if (rowCount > 0) {
        console.log('\n=== Содержимое таблицы ===');

        for (let i = 0; i < rowCount; i++) {
          const row = rows.nth(i);
          const cells = row.locator('td');
          const cellCount = await cells.count();
          const cellTexts: string[] = [];

          for (let j = 0; j < cellCount; j++) {
            const cellText = await cells.nth(j).innerText();
            cellTexts.push(cellText.trim());
          }

          const rowText = cellTexts.join(' | ');
          console.log(`Строка ${i + 1}: ${rowText}`);

          // Особое внимание строке с 0,6к
          if (rowText.includes('0,6')) {
            console.log(`\n>>> НАЙДЕНА СТРОКА 0,6к (строка ${i + 1}):`);
            console.log(`    Полное содержимое: ${rowText}`);
            cellTexts.forEach((text, idx) => {
              console.log(`    Ячейка ${idx}: "${text}"`);
            });
          }
        }
        console.log('=========================\n');
      } else {
        console.log('⚠️ Таблица пустая (0 строк)');
      }
    }

    // Анализ console логов
    console.log('\n=== Анализ Console Логов ===');

    const debugLogs = consoleLogs.filter(log =>
      log.text.includes('DEBUG 0,6к Parameter') ||
      log.text.includes('All markup parameters') ||
      log.text.includes('Found 0,6к parameter') ||
      log.text.includes('Final coefficient06 value') ||
      log.text.includes('Works (раб)') ||
      log.text.includes('WorksComp (раб-комп.)') ||
      log.text.includes('WorksSu10Only base') ||
      log.text.includes('Calculated 0,6к cost')
    );

    if (debugLogs.length > 0) {
      console.log(`Найдено ${debugLogs.length} debug логов:`);
      debugLogs.forEach(log => {
        console.log(log.text);
      });
    } else {
      console.log('⚠️ Debug логи не найдены!');
      console.log('\nВсе console логи:');
      consoleLogs.forEach(log => {
        if (log.type === 'log') {
          console.log(log.text);
        }
      });
    }
    console.log('=========================\n');

    // Ждём ещё немного, чтобы убедиться, что все логи выведены
    await page.waitForTimeout(2000);
  });
});
