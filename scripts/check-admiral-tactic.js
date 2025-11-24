import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmiralTactic() {
  console.log('\n🔍 АНАЛИЗ СХЕМЫ НАЦЕНОК ДЛЯ ТЕНДЕРА ЖК АДМИРАЛ\n');
  console.log('═══════════════════════════════════════════\n');

  // Получаем тендер
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
    .eq('title', 'ЖК Адмирал')
    .single();

  if (!tender) {
    console.log('❌ Тендер не найден');
    return;
  }

  console.log('📋 ИНФОРМАЦИЯ О ТЕНДЕРЕ:');
  console.log(`Название: ${tender.title}`);
  console.log(`Номер: ${tender.tender_number}`);

  if (tender.markup_tactics) {
    console.log(`\nСхема наценок: ${tender.markup_tactics.name}`);
    console.log(`ID схемы: ${tender.markup_tactics.id}`);
    console.log(`Глобальная: ${tender.markup_tactics.is_global ? 'Да' : 'Нет'}`);

    // Получаем параметры через tender_markup_percentage
    const { data: tenderParams } = await supabase
      .from('tender_markup_percentage')
      .select(`
        *,
        markup_parameter:markup_parameters(*)
      `)
      .eq('tender_id', tender.id);

    console.log('\n📝 ПАРАМЕТРЫ СХЕМЫ НАЦЕНОК:');
    console.log('─────────────────────────────────────────');

    if (!tenderParams || tenderParams.length === 0) {
      console.log('⚠️  Параметры не найдены!');
    } else {
      console.log(`\nВсего параметров: ${tenderParams.length}\n`);

      // Фильтруем параметры СМ, МВП+ГСМ и Гарантийный период
      const targetParams = tenderParams.filter(tp => {
        const label = tp.markup_parameter.label.toLowerCase();
        return label.includes('механизац') ||
               label.includes('буринц') ||
               label.includes('мвп') ||
               label.includes('гсм') ||
               label.includes('гарант');
      });

      console.log('🎯 ИСКОМЫЕ ПАРАМЕТРЫ:\n');

      targetParams.forEach((tp, idx) => {
        const param = tp.markup_parameter;
        console.log(`${idx + 1}. ${param.label}`);
        console.log(`   Ключ: ${param.key}`);
        console.log(`   Все поля параметра:`, JSON.stringify(param, null, 2));
        console.log('');
      });
    }
  } else {
    console.log('\n⚠️  Схема наценок не назначена тендеру!');
  }

  console.log('═══════════════════════════════════════════\n');
}

checkAdmiralTactic();
