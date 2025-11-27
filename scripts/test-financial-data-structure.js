import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFinancialDataStructure() {
  console.log('=== Проверка структуры финансовых данных ===\n');

  // Получаем первый тендер
  const { data: tenders, error: tendersError } = await supabase
    .from('tenders')
    .select('id, title')
    .limit(1);

  if (tendersError || !tenders || tenders.length === 0) {
    console.error('Ошибка загрузки тендеров:', tendersError);
    return;
  }

  const tenderId = tenders[0].id;
  console.log(`Тестируем тендер: ${tenders[0].title} (${tenderId})\n`);

  // Получаем финансовые показатели
  const { data: indicators, error: indicatorsError } = await supabase
    .from('financial_indicators')
    .select('*')
    .eq('tender_id', tenderId)
    .order('row_number', { ascending: true });

  if (indicatorsError) {
    console.error('Ошибка загрузки показателей:', indicatorsError);
    return;
  }

  console.log(`Всего показателей: ${indicators?.length || 0}\n`);

  // Выводим все строки с их параметрами
  console.log('Все строки финансовых показателей:');
  console.log('='.repeat(120));
  console.log(
    'Row# | Is Header | Is Total | Indicator Name' + ' '.repeat(50) + '| Total Cost'
  );
  console.log('='.repeat(120));

  let totalSum = 0;
  let directCostsSum = 0;
  let markupsSum = 0;

  indicators?.forEach(ind => {
    const rowNum = String(ind.row_number).padEnd(4);
    const isHeader = ind.is_header ? 'YES' : 'NO ';
    const isTotal = ind.is_total ? 'YES' : 'NO ';
    const name = (ind.indicator_name || '').padEnd(60);
    const cost = (ind.total_cost || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

    console.log(`${rowNum} | ${isHeader}       | ${isTotal}      | ${name} | ${cost}`);

    // Подсчитываем суммы
    if (!ind.is_header && !ind.is_total) {
      if (ind.row_number >= 2 && ind.row_number <= 6) {
        directCostsSum += ind.total_cost || 0;
      }
      if (ind.row_number >= 7 && ind.row_number <= 14) {
        markupsSum += ind.total_cost || 0;
      }
      if (ind.row_number >= 1 && ind.row_number <= 14) {
        totalSum += ind.total_cost || 0;
      }
    }

    // Записываем итоговую строку отдельно
    if (ind.is_total) {
      console.log('-'.repeat(120));
      console.log(`ИТОГОВАЯ СТРОКА: ${cost}`);
    }
  });

  console.log('='.repeat(120));
  console.log('\nПодсчет сумм:');
  console.log(`Прямые затраты (строки 2-6): ${directCostsSum.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);
  console.log(`Наценки (строки 7-14): ${markupsSum.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);
  console.log(`Сумма прямых + наценок: ${(directCostsSum + markupsSum).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);
  console.log(`\nВсего (строки 1-14, !is_header && !is_total): ${totalSum.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);

  // Находим итоговую строку
  const totalRow = indicators?.find(d => d.is_total);
  if (totalRow) {
    console.log(`Итоговая строка из базы: ${(totalRow.total_cost || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);
    console.log(`\nРазница: ${((totalRow.total_cost || 0) - (directCostsSum + markupsSum)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`);
  }
}

testFinancialDataStructure()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
