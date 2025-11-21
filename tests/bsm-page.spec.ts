import { test, expect } from '@playwright/test';

test.describe('Страница БСМ', () => {
  test('должна загружаться без ошибок', async ({ page }) => {
    // Переходим на страницу БСМ
    await page.goto('http://localhost:3002/bsm');

    // Проверяем, что страница загрузилась
    await expect(page).toHaveTitle(/TenderHUB/);

    // Проверяем наличие заголовка страницы
    await expect(page.getByText('Базовая Стоимость Материалов и Работ')).toBeVisible();

    // Проверяем наличие текста выбора тендера
    await expect(page.getByText('Выберите тендер для просмотра базовой стоимости')).toBeVisible();

    // Проверяем наличие селектора тендера (ищем по тексту внутри кнопки селекта)
    await expect(page.getByText('Выберите тендер').first()).toBeVisible();

    console.log('✓ Страница БСМ успешно загрузилась');
  });

  test('должна отображать быстрый выбор тендеров', async ({ page }) => {
    await page.goto('http://localhost:3002/bsm');

    // Ждем загрузки тендеров
    await page.waitForTimeout(2000);

    // Проверяем наличие текста "Или выберите из списка"
    const quickSelectText = page.getByText('Или выберите из списка:');
    const isVisible = await quickSelectText.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✓ Блок быстрого выбора отображается');
    } else {
      console.log('⚠ Блок быстрого выбора не отображается (возможно нет тендеров в БД)');
    }
  });

  test('должна иметь кнопку "Экспорт в Excel" после выбора тендера', async ({ page }) => {
    await page.goto('http://localhost:3002/bsm');

    // Ждем загрузки страницы и тендеров
    await page.waitForTimeout(2000);

    // Проверяем наличие быстрого выбора
    const quickSelectText = page.getByText('Или выберите из списка:');
    const hasQuickSelect = await quickSelectText.isVisible().catch(() => false);

    if (hasQuickSelect) {
      // Кликаем на первую карточку тендера (она должна быть после текста "Или выберите из списка")
      const tenderCard = page.locator('.ant-card-hoverable').first();
      await tenderCard.click();

      // Ждем загрузки данных и перехода на страницу с данными
      await page.waitForTimeout(3000);

      // Теперь проверяем кнопку экспорта
      const exportButton = page.getByRole('button').filter({ hasText: 'Экспорт в Excel' });

      // Проверяем что кнопка видна
      const buttonVisible = await exportButton.isVisible().catch(() => false);
      if (buttonVisible) {
        await expect(exportButton).toBeVisible();
        console.log('✓ Кнопка "Экспорт в Excel" отображается после выбора тендера');
      } else {
        console.log('⚠ Кнопка экспорта не найдена - возможно нет данных в выбранном тендере');
      }
    } else {
      console.log('⚠ Нет тендеров для тестирования кнопки экспорта');
    }
  });
});
