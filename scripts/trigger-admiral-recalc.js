import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCalculationResults() {
  console.log('\n🔍 ПРОВЕРКА ФАКТИЧЕСКИХ РЕЗУЛЬТАТОВ РАСЧЁТА\n');
  console.log('═══════════════════════════════════════════\n');

  // Получаем тендер
  const { data: tender } = await supabase
    .from('tenders')
    .select('id, title')
    .eq('title', 'ЖК Адмирал')
    .single();

  if (!tender) {
    console.log('❌ Тендер не найден');
    return;
  }

  console.log(`📋 ТЕНДЕР: ${tender.title}\n`);

  // Получаем несколько BOQ элементов для проверки
  const { data: boqItems } = await supabase
    .from('boq_items')
    .select('*')
    .eq('tender_id', tender.id)
    .limit(20);

  if (!boqItems || boqItems.length === 0) {
    console.log('⚠️  Нет элементов BOQ');
    return;
  }

  console.log(`Найдено ${boqItems.length} элементов BOQ\n`);

  // Группируем по типу
  const byType = {};
  boqItems.forEach(item => {
    const type = item.boq_item_type;
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push(item);
  });

  console.log('📊 РЕЗУЛЬТАТЫ ПО ТИПАМ:\n');

  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n📌 ${type.toUpperCase()}:`);
    console.log('─────────────────────────────────────────');

    items.slice(0, 3).forEach((item, idx) => {
      const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(type);
      const baseAmount = item.total_amount || 0;
      const commercialCost = isMaterial
        ? (item.total_commercial_material_cost || 0)
        : (item.total_commercial_work_cost || 0);
      const coeff = baseAmount > 0 ? (commercialCost / baseAmount) : 0;

      console.log(`   ${idx + 1}. База: ${baseAmount.toFixed(2)}, Коммерч: ${commercialCost.toFixed(2)}, Коэф: ${coeff.toFixed(6)}`);
    });
  }

  console.log('\n\n📈 СРЕДНИЕ КОЭФФИЦИЕНТЫ ПО ТИПАМ:\n');

  for (const [type, items] of Object.entries(byType)) {
    const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(type);

    let totalBase = 0;
    let totalCommercial = 0;

    items.forEach(item => {
      const baseAmount = item.total_amount || 0;
      const commercialCost = isMaterial
        ? (item.total_commercial_material_cost || 0)
        : (item.total_commercial_work_cost || 0);

      totalBase += baseAmount;
      totalCommercial += commercialCost;
    });

    const avgCoeff = totalBase > 0 ? (totalCommercial / totalBase) : 0;
    console.log(`   ${type}: ${avgCoeff.toFixed(6)} (${items.length} элементов)`);
  }

  console.log('\n═══════════════════════════════════════════\n');
}

checkCalculationResults();
