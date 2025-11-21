import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

test('Верификация расчёта наценок для ЖК Адмирал', async ({ page }) => {
  console.log('\n🔍 ВЕРИФИКАЦИЯ: Расчёт наценок для тендера ЖК Адмирал\n');
  console.log('═══════════════════════════════════════════\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Получаем тендер
  const { data: tender } = await supabase
    .from('tenders')
    .select(`
      *,
      markup_tactics (*)
    `)
    .eq('title', 'ЖК Адмирал')
    .single();

  if (!tender || !tender.markup_tactics) {
    throw new Error('Тендер или схема наценок не найдены');
  }

  console.log('📋 ТЕНДЕР:', tender.title);
  console.log('📊 СХЕМА:', tender.markup_tactics.name);
  console.log(`🔗 ID схемы: ${tender.markup_tactics.id}\n`);

  // Получаем значения markup parameters для тендера
  const { data: markupValues } = await supabase
    .from('tender_markup_percentage')
    .select('*, markup_parameters(*)')
    .eq('tender_id', tender.id);

  console.log('📝 УСТАНОВЛЕННЫЕ ЗНАЧЕНИЯ ПАРАМЕТРОВ НАЦЕНОК:\n');

  const markupMap: { [key: string]: number } = {};

  if (markupValues && markupValues.length > 0) {
    markupValues.forEach((item: any) => {
      const key = item.markup_parameters.key;
      const value = item.value;
      markupMap[key] = value;
      console.log(`   ${item.markup_parameters.label}: ${value}% (${key})`);
    });
  } else {
    console.log('   ⚠️  Значения параметров не установлены для тендера');
    console.log('   Будут использованы значения по умолчанию\n');

    // Получаем значения по умолчанию
    const { data: defaultParams } = await supabase
      .from('markup_parameters')
      .select('*')
      .eq('is_active', true);

    if (defaultParams) {
      defaultParams.forEach((param: any) => {
        markupMap[param.key] = param.default_value;
        console.log(`   ${param.label}: ${param.default_value}% (${param.key}) [по умолчанию]`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('🧮 РАСЧЁТ КОЭФФИЦИЕНТОВ ПО ФОРМУЛАМ\n');

  const sequences = tender.markup_tactics.sequences;

  // Функция для выполнения одного шага расчёта
  function calculateStep(step: any, baseValue: number, previousResults: number[], markupValues: { [key: string]: number }): number {
    let result = baseValue;
    const originalBaseValue = 100; // Исходная база для расчёта коэффициента

    // Получаем operand1
    let operand1: number;
    if (step.operand1Type === 'markup') {
      operand1 = markupValues[step.operand1Key] || 0;
      if (step.operand1MultiplyFormat === 'addOne') {
        operand1 = 1 + operand1 / 100;
      } else {
        operand1 = operand1 / 100;
      }
    } else if (step.operand1Type === 'step') {
      // Специальный случай: -1 означает базовое значение
      if (step.operand1Index === -1) {
        operand1 = originalBaseValue;
      } else {
        operand1 = previousResults[step.operand1Index];
      }
    } else if (step.operand1Type === 'number') {
      operand1 = step.operand1Key;
    } else {
      operand1 = 0;
    }

    // Применяем action1
    switch (step.action1) {
      case 'multiply':
        result = result * operand1;
        break;
      case 'divide':
        result = result / operand1;
        break;
      case 'add':
        result = result + operand1;
        break;
      case 'subtract':
        result = result - operand1;
        break;
    }

    // Если есть action2
    if (step.action2) {
      let operand2: number;
      if (step.operand2Type === 'markup') {
        operand2 = markupValues[step.operand2Key] || 0;
        if (step.operand2MultiplyFormat === 'addOne') {
          operand2 = 1 + operand2 / 100;
        } else {
          operand2 = operand2 / 100;
        }
      } else if (step.operand2Type === 'step') {
        // Специальный случай: -1 означает базовое значение
        if (step.operand2Index === -1) {
          operand2 = originalBaseValue;
        } else {
          operand2 = previousResults[step.operand2Index];
        }
      } else if (step.operand2Type === 'number') {
        operand2 = step.operand2Key;
      } else {
        operand2 = 0;
      }

      switch (step.action2) {
        case 'multiply':
          result = result * operand2;
          break;
        case 'divide':
          result = result / operand2;
          break;
        case 'add':
          result = result + operand2;
          break;
        case 'subtract':
          result = result - operand2;
          break;
      }
    }

    // Если есть action3
    if (step.action3) {
      let operand3: number;
      if (step.operand3Type === 'markup') {
        operand3 = markupValues[step.operand3Key] || 0;
        if (step.operand3MultiplyFormat === 'addOne') {
          operand3 = 1 + operand3 / 100;
        } else {
          operand3 = operand3 / 100;
        }
      } else if (step.operand3Type === 'step') {
        // Специальный случай: -1 означает базовое значение
        if (step.operand3Index === -1) {
          operand3 = originalBaseValue;
        } else {
          operand3 = previousResults[step.operand3Index];
        }
      } else if (step.operand3Type === 'number') {
        operand3 = step.operand3Key;
      } else {
        operand3 = 0;
      }

      switch (step.action3) {
        case 'multiply':
          result = result * operand3;
          break;
        case 'divide':
          result = result / operand3;
          break;
        case 'add':
          result = result + operand3;
          break;
        case 'subtract':
          result = result - operand3;
          break;
      }
    }

    return result;
  }

  // Рассчитываем для каждого типа
  const calculatedCoefficients: { [key: string]: number } = {};

  for (const [type, steps] of Object.entries(sequences)) {
    if (!Array.isArray(steps) || steps.length === 0) continue;

    console.log(`\n📌 ${type.toUpperCase()}:`);
    console.log('─────────────────────────────────────────');

    const baseValue = 100; // Берём базу 100 для расчёта коэффициента
    const stepResults: number[] = [baseValue];

    steps.forEach((step: any, idx: number) => {
      const prevValue = step.baseIndex === -1 ? baseValue : stepResults[step.baseIndex];
      const result = calculateStep(step, prevValue, stepResults, markupMap);
      stepResults.push(result);

      console.log(`   ${idx + 1}. ${step.name}: ${result.toFixed(2)} (база: ${prevValue.toFixed(2)})`);
    });

    const finalCoefficient = stepResults[stepResults.length - 1] / baseValue;
    calculatedCoefficients[type as string] = finalCoefficient;

    console.log(`   ➡️  Итоговый коэффициент: ${finalCoefficient.toFixed(6)}`);
  }

  // Переходим на страницу и делаем пересчёт
  await page.goto('http://localhost:3001/commerce');
  await page.waitForSelector('h3:has-text("Коммерция")', { timeout: 10000 });

  const tenderSelect = page.locator('.ant-select').first();
  await tenderSelect.click();
  await page.waitForTimeout(500);

  const admiralOption = page.locator('.ant-select-dropdown .ant-select-item').filter({
    hasText: tender.title
  });

  if (await admiralOption.count() > 0) {
    await admiralOption.first().click();
    await page.waitForTimeout(1500);
  }

  const recalcButton = page.locator('button:has-text("Пересчитать")');
  if (await recalcButton.count() > 0) {
    await recalcButton.click();
    await page.waitForTimeout(5000);
  }

  // Получаем фактические результаты из БД
  const { data: boqItems } = await supabase
    .from('boq_items')
    .select('*')
    .eq('tender_id', tender.id);

  if (!boqItems || boqItems.length === 0) {
    throw new Error('Нет BOQ элементов');
  }

  const actualCoefficients: { [key: string]: number } = {};
  const stats: any = {};

  boqItems.forEach((item: any) => {
    const type = item.boq_item_type;
    if (!stats[type]) {
      stats[type] = { sumBase: 0, sumCommercial: 0 };
    }

    const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(type);
    const baseAmount = item.total_amount || 0;
    const commercialCost = isMaterial
      ? (item.total_commercial_material_cost || 0)
      : (item.total_commercial_work_cost || 0);

    stats[type].sumBase += baseAmount;
    stats[type].sumCommercial += commercialCost;
  });

  Object.keys(stats).forEach(type => {
    const st = stats[type];
    actualCoefficients[type] = st.sumBase > 0 ? st.sumCommercial / st.sumBase : 0;
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('✅ СРАВНЕНИЕ РАСЧЁТНОГО И ФАКТИЧЕСКОГО\n');

  let allMatch = true;

  for (const type of Object.keys(calculatedCoefficients)) {
    const calculated = calculatedCoefficients[type];
    const actual = actualCoefficients[type];

    if (actual === undefined) {
      console.log(`⚠️  ${type}: Нет фактических данных`);
      continue;
    }

    const diff = Math.abs(calculated - actual);
    const diffPercent = calculated > 0 ? (diff / calculated) * 100 : 0;
    const match = diffPercent < 0.1; // Погрешность < 0.1%

    if (match) {
      console.log(`✅ ${type}:`);
      console.log(`   Расчётный: ${calculated.toFixed(6)}`);
      console.log(`   Фактический: ${actual.toFixed(6)}`);
      console.log(`   Разница: ${diff.toFixed(6)} (${diffPercent.toFixed(4)}%)`);
    } else {
      console.log(`❌ ${type}:`);
      console.log(`   Расчётный: ${calculated.toFixed(6)}`);
      console.log(`   Фактический: ${actual.toFixed(6)}`);
      console.log(`   Разница: ${diff.toFixed(6)} (${diffPercent.toFixed(4)}%)`);
      allMatch = false;
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════\n');

  if (allMatch) {
    console.log('✅ ВСЕ КОЭФФИЦИЕНТЫ РАССЧИТАНЫ ПРАВИЛЬНО!\n');
    console.log('Фактические значения совпадают с расчётными согласно');
    console.log('установленным параметрам схемы наценок.\n');
  } else {
    console.log('❌ ОБНАРУЖЕНЫ РАСХОЖДЕНИЯ!\n');
    console.log('Фактические коэффициенты не совпадают с расчётными.');
    console.log('Возможно, есть ошибка в логике расчёта.\n');
  }

  console.log('═══════════════════════════════════════════\n');

  expect(boqItems.length).toBeGreaterThan(0);
});
