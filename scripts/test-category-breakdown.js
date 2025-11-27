import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCategoryBreakdown() {
  console.log('=== Тест детализации по категориям ===\n');

  // Получаем первый тендер
  const { data: tenders, error: tendersError } = await supabase
    .from('tenders')
    .select('id, title')
    .limit(1);

  if (tendersError) {
    console.error('Ошибка загрузки тендеров:', tendersError);
    return;
  }

  if (!tenders || tenders.length === 0) {
    console.log('Нет тендеров в базе');
    return;
  }

  const tenderId = tenders[0].id;
  console.log(`Тестируем тендер: ${tenders[0].title} (${tenderId})\n`);

  // Тестируем запрос с вложенной структурой (как в коде)
  console.log('=== Запрос 1: Субподряд (суб-раб, суб-мат) ===');
  const { data: subcontractItems, error: subError } = await supabase
    .from('boq_items')
    .select(`
      boq_item_type,
      total_amount,
      detail_cost_category:detail_cost_categories(
        id,
        detail_name,
        location_name,
        cost_category:cost_categories(id, name)
      ),
      client_position:client_positions!inner(tender_id)
    `)
    .eq('client_position.tender_id', tenderId)
    .in('boq_item_type', ['суб-раб', 'суб-мат']);

  if (subError) {
    console.error('❌ Ошибка запроса:', subError);
    console.error('   Code:', subError.code);
    console.error('   Message:', subError.message);
    console.error('   Details:', subError.details);
    console.error('   Hint:', subError.hint);
  } else {
    console.log(`✅ Запрос успешен! Найдено элементов: ${subcontractItems?.length || 0}`);

    if (subcontractItems && subcontractItems.length > 0) {
      console.log('\nПример первого элемента:');
      const first = subcontractItems[0];
      console.log('  Тип:', first.boq_item_type);
      console.log('  Сумма:', first.total_amount);
      console.log('  Категория:', first.detail_cost_category?.cost_category?.name);
      console.log('  Вид:', first.detail_cost_category?.detail_name);
      console.log('  Локализация:', first.detail_cost_category?.location_name);

      // Группировка по категориям
      const categoryMap = new Map();

      subcontractItems.forEach(item => {
        const categoryName = item.detail_cost_category?.cost_category?.name || 'Без категории';
        const detailName = item.detail_cost_category?.detail_name || 'Без вида';
        const locationName = item.detail_cost_category?.location_name || 'Без локализации';
        const amount = item.total_amount || 0;
        const isWork = item.boq_item_type === 'раб' || item.boq_item_type === 'суб-раб' || item.boq_item_type === 'раб-комп.';

        const key = `${categoryName}|${detailName}|${locationName}`;

        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            category_name: categoryName,
            detail_name: detailName,
            location_name: locationName,
            total_amount: 0,
            works_amount: 0,
            materials_amount: 0,
          });
        }

        const cat = categoryMap.get(key);
        cat.total_amount += amount;

        if (isWork) {
          cat.works_amount += amount;
        } else {
          cat.materials_amount += amount;
        }
      });

      const breakdown = Array.from(categoryMap.values())
        .sort((a, b) => b.total_amount - a.total_amount);

      console.log(`\n=== Детализация (${breakdown.length} строк) ===`);
      breakdown.forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.category_name} → ${item.detail_name} → ${item.location_name}`);
        console.log(`   Работы: ${item.works_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
        console.log(`   Материалы: ${item.materials_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
        console.log(`   Итого: ${item.total_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
      });

      const totalWorks = breakdown.reduce((sum, item) => sum + item.works_amount, 0);
      const totalMaterials = breakdown.reduce((sum, item) => sum + item.materials_amount, 0);
      const total = breakdown.reduce((sum, item) => sum + item.total_amount, 0);

      console.log('\n' + '='.repeat(60));
      console.log('ИТОГО:');
      console.log(`Работы: ${totalWorks.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
      console.log(`Материалы: ${totalMaterials.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
      console.log(`Всего: ${total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
    }
  }

  console.log('\n=== Запрос 2: Работы + Материалы СУ-10 (раб, мат) ===');
  const { data: su10Items, error: su10Error } = await supabase
    .from('boq_items')
    .select(`
      boq_item_type,
      total_amount,
      detail_cost_category:detail_cost_categories(
        id,
        detail_name,
        location_name,
        cost_category:cost_categories(id, name)
      ),
      client_position:client_positions!inner(tender_id)
    `)
    .eq('client_position.tender_id', tenderId)
    .in('boq_item_type', ['раб', 'мат']);

  if (su10Error) {
    console.error('❌ Ошибка запроса:', su10Error);
  } else {
    console.log(`✅ Запрос успешен! Найдено элементов: ${su10Items?.length || 0}`);
  }
}

testCategoryBreakdown()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
