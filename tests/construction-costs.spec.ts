import { test, expect } from '@playwright/test';

test.describe('Затраты на строительство', () => {
  test('должна загружаться страница выбора тендера', async ({ page }) => {
    await page.goto('http://localhost:3002/costs');

    // Проверяем заголовок (берем именно h4)
    await expect(page.locator('h4:has-text("Затраты на строительство")')).toBeVisible();

    // Проверяем наличие Select для выбора тендера
    await expect(page.locator('.ant-select-selector').first()).toBeVisible();

    // Проверяем текст подсказки
    await expect(page.locator('text=Выберите тендер для просмотра затрат')).toBeVisible();
  });

  test('должна загружаться таблица после выбора тендера', async ({ page }) => {
    await page.goto('http://localhost:3002/costs');

    // Ждем загрузки списка тендеров
    await page.waitForTimeout(2000);

    // Проверяем наличие карточек быстрого выбора
    const cards = page.locator('.ant-card-hoverable');
    const cardsCount = await cards.count();

    console.log(`Найдено карточек быстрого выбора: ${cardsCount}`);

    if (cardsCount > 0) {
      // Кликаем на первую карточку
      await cards.first().click();

      // Ждем загрузки данных
      await page.waitForTimeout(3000);

      // Проверяем, что появилась кнопка "Назад"
      await expect(page.locator('button:has-text("← Назад к выбору тендера")')).toBeVisible();

      // Проверяем наличие таблицы
      await expect(page.locator('.ant-table')).toBeVisible();

      // Проверяем наличие панели управления
      await expect(page.locator('text=Тип затрат:')).toBeVisible();
      await expect(page.locator('text=Прямые затраты')).toBeVisible();

      // Проверяем наличие заголовков столбцов
      await expect(page.locator('th:has-text("Категория")').first()).toBeVisible();
      await expect(page.locator('th:has-text("Вид")').first()).toBeVisible();
      await expect(page.locator('th:has-text("Локация")').first()).toBeVisible();
      await expect(page.locator('th:has-text("Объем")').first()).toBeVisible();
      await expect(page.locator('th:has-text("Итого")').first()).toBeVisible();

      // Проверяем наличие строк данных или пустого состояния
      const rows = page.locator('.ant-table-tbody tr');
      const rowsCount = await rows.count();
      console.log(`Найдено строк в таблице: ${rowsCount}`);

      // Должна быть хотя бы одна строка (данные или "Нет данных")
      expect(rowsCount).toBeGreaterThan(0);
    } else {
      console.log('Нет доступных тендеров для тестирования');
    }
  });

  test('должна переключаться между прямыми и коммерческими затратами', async ({ page }) => {
    await page.goto('http://localhost:3002/costs');

    await page.waitForTimeout(2000);

    const cards = page.locator('.ant-card-hoverable');
    const cardsCount = await cards.count();

    if (cardsCount > 0) {
      await cards.first().click();
      await page.waitForTimeout(3000);

      // Проверяем, что по умолчанию выбраны "Прямые затраты"
      const directCostsButton = page.locator('.ant-segmented-item:has-text("Прямые затраты")');
      await expect(directCostsButton).toHaveClass(/ant-segmented-item-selected/);

      // Переключаем на "Коммерческие затраты"
      await page.locator('.ant-segmented-item:has-text("Коммерческие затраты")').click();
      await page.waitForTimeout(1000);

      // Проверяем, что переключилось
      const commercialCostsButton = page.locator('.ant-segmented-item:has-text("Коммерческие затраты")');
      await expect(commercialCostsButton).toHaveClass(/ant-segmented-item-selected/);
    }
  });

  test('должна работать кнопка "Назад к выбору тендера"', async ({ page }) => {
    await page.goto('http://localhost:3002/costs');

    await page.waitForTimeout(2000);

    const cards = page.locator('.ant-card-hoverable');
    const cardsCount = await cards.count();

    if (cardsCount > 0) {
      await cards.first().click();
      await page.waitForTimeout(2000);

      // Проверяем, что появилась таблица
      await expect(page.locator('.ant-table')).toBeVisible();

      // Кликаем на кнопку "Назад"
      await page.locator('button:has-text("← Назад к выбору тендера")').click();

      // Проверяем, что вернулись на экран выбора
      await expect(page.locator('text=Выберите тендер для просмотра затрат')).toBeVisible();
      await expect(page.locator('.ant-table')).not.toBeVisible();
    }
  });

  test('должно появляться поле выбора версии после быстрого выбора тендера', async ({ page }) => {
    await page.goto('http://localhost:3002/costs');

    await page.waitForTimeout(2000);

    const cards = page.locator('.ant-card-hoverable');
    const cardsCount = await cards.count();

    if (cardsCount > 0) {
      // Кликаем на первую карточку быстрого выбора
      await cards.first().click();

      // Ждем загрузки данных
      await page.waitForTimeout(3000);

      // Проверяем наличие поля выбора тендера
      await expect(page.locator('text=Тендер:')).toBeVisible();

      // Проверяем наличие поля выбора версии
      await expect(page.locator('text=Версия:')).toBeVisible();

      // Проверяем, что есть селекты тендера и версии
      const selects = page.locator('.ant-select-selector');
      const selectsCount = await selects.count();

      console.log(`✓ Найдено ${selectsCount} селектов после быстрого выбора`);
      // Должно быть минимум 2 селекта: тендер и версия
      expect(selectsCount).toBeGreaterThanOrEqual(2);

      // Проверяем, что данные загрузились
      await expect(page.locator('.ant-table')).toBeVisible();
      console.log('✓ Данные автоматически загрузились после быстрого выбора');
    } else {
      console.log('Нет доступных тендеров для тестирования');
    }
  });
});
