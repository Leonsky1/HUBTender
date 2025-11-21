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

    // Получаем параметры схемы
    const { data: parameters } = await supabase
      .from('markup_parameters')
      .select('*')
      .eq('markup_tactic_id', tender.markup_tactics.id)
      .order('order_number', { ascending: true });

    console.log('\n📝 ПАРАМЕТРЫ СХЕМЫ НАЦЕНОК:');
    console.log('─────────────────────────────────────────');

    if (!parameters || parameters.length === 0) {
      console.log('⚠️  Параметры не найдены!');
    } else {
      console.log(`\nВсего параметров: ${parameters.length}\n`);

      parameters.forEach((param, idx) => {
        console.log(`${idx + 1}. ${param.parameter_name}`);
        console.log(`   База: ${param.base_value}`);
        console.log(`   Коэффициент: ${param.coefficient}`);
        console.log(`   Процент: ${param.is_percentage ? 'Да' : 'Нет'}`);
        console.log(`   Порядок: ${param.order_number}`);
        console.log('');
      });
    }
  } else {
    console.log('\n⚠️  Схема наценок не назначена тендеру!');
  }

  console.log('═══════════════════════════════════════════\n');
}

checkAdmiralTactic();
