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

async function showAdmiralSequences() {
  console.log('\n🔍 АНАЛИЗ SEQUENCES ДЛЯ ТЕНДЕРА ЖК АДМИРАЛ\n');
  console.log('═══════════════════════════════════════════\n');

  // Получаем тендер с тактикой
  const { data: tender } = await supabase
    .from('tenders')
    .select(`
      *,
      markup_tactics (*)
    `)
    .eq('title', 'ЖК Адмирал')
    .single();

  if (!tender || !tender.markup_tactics) {
    console.log('❌ Тендер или тактика не найдены');
    return;
  }

  console.log('📋 ИНФОРМАЦИЯ:');
  console.log(`Тендер: ${tender.title}`);
  console.log(`Тактика: ${tender.markup_tactics.name}`);
  console.log(`ID тактики: ${tender.markup_tactics.id}\n`);

  console.log('📝 SEQUENCES (параметры для каждого типа):\n');
  console.log(JSON.stringify(tender.markup_tactics.sequences, null, 2));

  console.log('\n📊 BASE COSTS:\n');
  console.log(JSON.stringify(tender.markup_tactics.base_costs, null, 2));

  console.log('\n═══════════════════════════════════════════\n');
}

showAdmiralSequences();
