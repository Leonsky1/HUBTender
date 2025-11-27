import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSubcontractData() {
  console.log('=== Проверка данных субподряда ===\n');

  // Получаем первый тендер
  const { data: tenders, error: tendersError } = await supabase
    .from('tenders')
    .select('id, title')
    .limit(5);

  if (tendersError) {
    console.error('Ошибка загрузки тендеров:', tendersError);
    return;
  }

  console.log('Доступные тендеры:');
  tenders.forEach((t, idx) => {
    console.log(`  ${idx + 1}. ${t.title} (${t.id})`);
  });

  if (tenders.length === 0) {
    console.log('Нет тендеров в базе');
    return;
  }

  const tenderId = tenders[0].id;
  console.log(`\nПроверяем тендер: ${tenders[0].title}`);

  // Проверяем наличие элементов субподряда
  const { data: boqItems, error: boqError } = await supabase
    .from('boq_items')
    .select(`
      *,
      detail_cost_category:detail_cost_categories(
        id,
        detail_name,
        cost_category:cost_categories(id, category_name)
      ),
      client_position:client_positions!inner(tender_id)
    `)
    .eq('client_position.tender_id', tenderId)
    .in('boq_item_type', ['суб-раб', 'суб-мат']);

  if (boqError) {
    console.error('Ошибка загрузки BOQ элементов:', boqError);
    return;
  }

  console.log(`\nНайдено элементов субподряда: ${boqItems?.length || 0}`);

  if (!boqItems || boqItems.length === 0) {
    console.log('\n⚠️  В этом тендере нет элементов субподряда!');
    console.log('Проверим все типы элементов:');

    const { data: allItems } = await supabase
      .from('boq_items')
      .select('boq_item_type, client_position:client_positions!inner(tender_id)')
      .eq('client_position.tender_id', tenderId);

    const typeCounts = {};
    allItems?.forEach(item => {
      typeCounts[item.boq_item_type] = (typeCounts[item.boq_item_type] || 0) + 1;
    });

    console.log('\nРаспределение по типам:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    return;
  }

  // Группируем по категориям
  const categoryMap = new Map();

  boqItems.forEach(item => {
    const categoryName = item.detail_cost_category?.cost_category?.category_name || 'Без категории';
    const amount = item.total_amount || 0;
    const isWork = item.boq_item_type === 'суб-раб';

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        category_name: categoryName,
        total_amount: 0,
        works_amount: 0,
        materials_amount: 0,
      });
    }

    const cat = categoryMap.get(categoryName);
    cat.total_amount += amount;

    if (isWork) {
      cat.works_amount += amount;
    } else {
      cat.materials_amount += amount;
    }
  });

  console.log('\nДетализация по категориям затрат:');
  const breakdown = Array.from(categoryMap.values()).sort((a, b) => b.total_amount - a.total_amount);

  breakdown.forEach((cat, idx) => {
    console.log(`\n${idx + 1}. ${cat.category_name}`);
    console.log(`   Работы: ${cat.works_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
    console.log(`   Материалы: ${cat.materials_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
    console.log(`   Итого: ${cat.total_amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
  });

  const totalWorks = breakdown.reduce((sum, cat) => sum + cat.works_amount, 0);
  const totalMaterials = breakdown.reduce((sum, cat) => sum + cat.materials_amount, 0);
  const total = breakdown.reduce((sum, cat) => sum + cat.total_amount, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log('ИТОГО:');
  console.log(`Работы: ${totalWorks.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
  console.log(`Материалы: ${totalMaterials.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
  console.log(`Всего: ${total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.`);
}

checkSubcontractData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
