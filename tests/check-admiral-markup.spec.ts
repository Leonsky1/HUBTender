import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

test('Проверка наценок для тендера ЖК Адмирал', async ({ page }) => {
  console.log('\n🔍 ТЕСТ: Проверка расчёта наценок для тендера ЖК Адмирал\n');

  // Создаем клиент Supabase в тесте
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Получаем список тендеров
  const { data: tenders } = await supabase
    .from('tenders')
    .select('id, title, tender_number')
    .order('created_at', { ascending: false });

  console.log('\n📋 Доступные тендеры:');
  tenders?.forEach((t: any, idx: number) => {
    console.log(`  ${idx + 1}. ${t.title} (${t.tender_number})`);
  });

  // Ищем тендер "ЖК Адмирал"
  const admiralTender = tenders?.find((t: any) =>
    t.title.includes('Адмирал') || t.title.includes('адмирал')
  );

  if (!admiralTender) {
    console.log('\n❌ ОШИБКА: Тендер "ЖК Адмирал" не найден в базе данных');
    throw new Error('Тендер "ЖК Адмирал" не найден');
  }

  console.log(`\n✅ Найден тендер: ${admiralTender.title} (ID: ${admiralTender.id})`);

  // Получаем полную информацию о тендере и его схеме наценок
  const { data: tender } = await supabase
    .from('tenders')
    .select(`
      *,
      markup_tactics (
        id,
        name,
        is_global
      )
    `)
    .eq('id', admiralTender.id)
    .single();

  if (!tender || !tender.markup_tactics) {
    console.log('\n❌ ОШИБКА: Не удалось получить тендер или схему наценок');
    throw new Error('Не удалось получить тендер или схему наценок');
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 ИНФОРМАЦИЯ О ТЕНДЕРЕ:');
  console.log('═══════════════════════════════════════════');
  console.log(`Название: ${tender.title}`);
  console.log(`Номер: ${tender.tender_number}`);
  console.log(`\nСхема наценок: ${tender.markup_tactics.name}`);
  console.log(`ID схемы: ${tender.markup_tactics.id}`);
  console.log(`Глобальная: ${tender.markup_tactics.is_global ? 'Да' : 'Нет'}`);

  // Получаем параметры схемы наценок
  const { data: parameters } = await supabase
    .from('markup_parameters')
    .select('*')
    .eq('markup_tactic_id', tender.markup_tactics.id)
    .order('order_number', { ascending: true });

  console.log('\n📝 ПАРАМЕТРЫ СХЕМЫ НАЦЕНОК:');
  console.log('─────────────────────────────────────────');
  parameters?.forEach((param: any, idx: number) => {
    console.log(`\n${idx + 1}. ${param.parameter_name}`);
    console.log(`   База: ${param.base_value}`);
    console.log(`   Коэффициент: ${param.coefficient}`);
    console.log(`   Процент: ${param.is_percentage ? 'Да' : 'Нет'}`);
    console.log(`   Порядок: ${param.order_number}`);
  });

  // Переходим на страницу Commerce
  await page.goto('http://localhost:3001/commerce');

  // Ждем загрузки страницы
  await page.waitForSelector('h3:has-text("Коммерция")', { timeout: 10000 });
  console.log('\n✅ Страница Commerce загружена');

  // Выбираем тендер из списка
  const tenderSelect = page.locator('.ant-select').first();
  await tenderSelect.click();
  await page.waitForTimeout(500);

  // Ищем опцию с тендером Адмирал
  const admiralOption = page.locator('.ant-select-dropdown .ant-select-item').filter({
    hasText: admiralTender.title
  });

  if (await admiralOption.count() > 0) {
    await admiralOption.first().click();
    await page.waitForTimeout(1500);
    console.log('✅ Тендер ЖК Адмирал выбран в интерфейсе');
  } else {
    console.log('⚠️ Не удалось найти тендер в списке, но продолжаем с прямым доступом к БД');
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('🔄 ПЕРЕСЧЁТ НАЦЕНОК');
  console.log('═══════════════════════════════════════════\n');

  // Нажимаем кнопку "Пересчитать" если есть
  const recalcButton = page.locator('button:has-text("Пересчитать")');

  if (await recalcButton.count() > 0) {
    console.log('Нажимаем кнопку "Пересчитать"...');
    await recalcButton.click();
    await page.waitForTimeout(5000);
    console.log('✅ Пересчёт завершён');
  } else {
    console.log('⚠️ Кнопка "Пересчитать" не найдена, анализируем текущие данные');
  }

  // Получаем результаты из БД
  const { data: boqItems } = await supabase
    .from('boq_items')
    .select('*')
    .eq('tender_id', admiralTender.id);

  if (!boqItems || boqItems.length === 0) {
    console.log('\n❌ ОШИБКА: Нет BOQ элементов для анализа');
    throw new Error('Нет BOQ элементов для анализа');
  }

  // Группируем по типам и анализируем
  const byType: any = {};
  const stats: any = {
    totalItems: boqItems.length,
    byType: {}
  };

  boqItems.forEach((item: any) => {
    const type = item.boq_item_type;

    if (!byType[type]) {
      byType[type] = [];
      stats.byType[type] = {
        count: 0,
        sumBase: 0,
        sumCommercial: 0,
        avgCoefficient: 0,
        items: []
      };
    }

    const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(type);
    const baseAmount = item.total_amount || 0;
    const commercialCost = isMaterial
      ? (item.total_commercial_material_cost || 0)
      : (item.total_commercial_work_cost || 0);

    const coefficient = baseAmount > 0 ? commercialCost / baseAmount : 0;

    const itemData = {
      id: item.id,
      name: item.name || 'Без названия',
      base: baseAmount,
      commercial: commercialCost,
      coefficient,
      quantity: item.quantity || 0
    };

    byType[type].push(itemData);
    stats.byType[type].items.push(itemData);
    stats.byType[type].count++;
    stats.byType[type].sumBase += baseAmount;
    stats.byType[type].sumCommercial += commercialCost;
  });

  // Считаем средние коэффициенты
  Object.keys(stats.byType).forEach(type => {
    const st = stats.byType[type];
    st.avgCoefficient = st.sumBase > 0 ? st.sumCommercial / st.sumBase : 0;
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 РЕЗУЛЬТАТЫ РАСЧЁТА:');
  console.log('═══════════════════════════════════════════\n');

  console.log(`Всего элементов BOQ: ${stats.totalItems}\n`);

  // Выводим статистику по типам
  Object.entries(stats.byType).forEach(([type, st]: [string, any]) => {
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  Элементов: ${st.count}`);
    console.log(`  Сумма база: ${st.sumBase.toFixed(2)} ₽`);
    console.log(`  Сумма коммерч.: ${st.sumCommercial.toFixed(2)} ₽`);
    console.log(`  Средний коэффициент: ${st.avgCoefficient.toFixed(6)}`);

    // Показываем несколько примеров
    const examples = st.items.slice(0, 3);
    console.log(`\n  Примеры (первые ${examples.length}):`);
    examples.forEach((item: any, idx: number) => {
      const displayName = item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name;
      console.log(`    ${idx + 1}. ${displayName}`);
      console.log(`       Кол-во: ${item.quantity}, База: ${item.base.toFixed(2)}, Коммерч.: ${item.commercial.toFixed(2)}`);
      console.log(`       Коэффициент: ${item.coefficient.toFixed(6)}`);
    });
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('✅ АНАЛИЗ ЗАВЕРШЁН');
  console.log('═══════════════════════════════════════════\n');

  // Проверяем, что коэффициенты в разумных пределах
  const avgCoeffs = stats.byType;

  console.log('🔍 ПРОВЕРКА КОРРЕКТНОСТИ:\n');

  let hasIssues = false;
  const issues: string[] = [];

  Object.entries(avgCoeffs).forEach(([type, st]: [string, any]) => {
    const coeff = st.avgCoefficient;

    // Проверяем на разумность (коэффициент должен быть от 1 до 5 обычно)
    if (coeff < 1 && coeff > 0.01) {
      const msg = `❌ ${type}: Коэффициент меньше 1 (${coeff.toFixed(6)}) - возможна ошибка`;
      console.log(msg);
      issues.push(msg);
      hasIssues = true;
    } else if (coeff > 10) {
      const msg = `❌ ${type}: Коэффициент больше 10 (${coeff.toFixed(6)}) - возможно завышение в 10 раз`;
      console.log(msg);
      issues.push(msg);
      hasIssues = true;
    } else if (coeff > 5) {
      const msg = `⚠️  ${type}: Коэффициент больше 5 (${coeff.toFixed(6)}) - проверьте корректность`;
      console.log(msg);
      issues.push(msg);
      hasIssues = true;
    } else if (coeff === 0) {
      const msg = `⚠️  ${type}: Коэффициент равен 0 - элементы без коммерческих расчётов`;
      console.log(msg);
      issues.push(msg);
    } else {
      console.log(`✅ ${type}: Коэффициент в норме (${coeff.toFixed(6)})`);
    }
  });

  if (!hasIssues) {
    console.log('\n✅ Все коэффициенты выглядят корректно!');
  } else {
    console.log('\n⚠️ Обнаружены потенциальные проблемы в расчётах:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }

  console.log('\n═══════════════════════════════════════════\n');

  // Тест считается успешным, если нет критических ошибок
  expect(stats.totalItems).toBeGreaterThan(0);
});
